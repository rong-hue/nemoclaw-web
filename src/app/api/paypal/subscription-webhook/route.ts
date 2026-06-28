export const runtime = 'edge';

import { subscriptionsService } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

/**
 * 幂等检查：记录已处理的 transmission_id，防止重放攻击（M2）
 * 表结构（在 Supabase SQL Editor 执行一次）：
 *   create table if not exists webhook_events (
 *     id uuid primary key default gen_random_uuid(),
 *     transmission_id text not null unique,
 *     event_type text not null,
 *     processed_at timestamptz not null default now()
 *   );
 *   create index if not exists webhook_events_tid on webhook_events (transmission_id);
 *   alter table webhook_events enable row level security;
 *   -- 只允许服务端写入，不允许客户端读写
 */
async function isAlreadyProcessed(transmissionId: string, eventType: string): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  // 尝试插入，unique 约束冲突说明已处理过
  const { error } = await supabase
    .from('webhook_events')
    .insert({ transmission_id: transmissionId, event_type: eventType });

  if (error) {
    if (error.code === '23505') return true; // unique_violation = 已处理
    throw error; // 其他错误向上抛
  }
  return false;
}

// PayPal Webhook 签名验证 + 事件处理
// Webhook URL: https://nemoclaw-web.pages.dev/api/paypal/subscription-webhook

async function verifyPayPalWebhook(req: Request, rawBody: string): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  const mode = process.env.PAYPAL_MODE ?? 'sandbox';
  const baseUrl = mode === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  if (!webhookId) {
    console.error('[PayPal Webhook] PAYPAL_WEBHOOK_ID not set');
    return false;
  }

  // 获取 OAuth token
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;
  const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const { access_token } = await tokenRes.json() as { access_token: string };

  // 调用 PayPal 签名验证 API
  const verifyRes = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      auth_algo: req.headers.get('paypal-auth-algo'),
      cert_url: req.headers.get('paypal-cert-url'),
      transmission_id: req.headers.get('paypal-transmission-id'),
      transmission_sig: req.headers.get('paypal-transmission-sig'),
      transmission_time: req.headers.get('paypal-transmission-time'),
      webhook_id: webhookId,
      webhook_event: JSON.parse(rawBody),
    }),
  });

  const { verification_status } = await verifyRes.json() as { verification_status: string };
  return verification_status === 'SUCCESS';
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();

    // 签名验证
    const isValid = await verifyPayPalWebhook(req, rawBody);
    if (!isValid) {
      console.error('[PayPal Webhook] Signature verification failed');
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody) as {
      event_type: string;
      resource: {
        id: string;
        custom_id?: string;
        status?: string;
        billing_info?: {
          next_billing_time?: string;
        };
      };
    };

    const { event_type, resource } = event;
    const subscriptionId = resource.id;
    const nextBillingTime = resource.billing_info?.next_billing_time ?? null;
    const transmissionId = req.headers.get('paypal-transmission-id') ?? '';

    console.log(`[PayPal Webhook] ${event_type} | sub=${subscriptionId} | tid=${transmissionId}`);

    // 幂等检查：防止重放攻击（M2）
    if (transmissionId) {
      const duplicate = await isAlreadyProcessed(transmissionId, event_type);
      if (duplicate) {
        console.log(`[PayPal Webhook] Duplicate event ignored: ${transmissionId}`);
        return Response.json({ received: true, duplicate: true });
      }
    }

    switch (event_type) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await subscriptionsService.updateStatus(subscriptionId, 'active', nextBillingTime);
        break;
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await subscriptionsService.updateStatus(subscriptionId, 'cancelled', null);
        break;
      case 'BILLING.SUBSCRIPTION.EXPIRED':
        await subscriptionsService.updateStatus(subscriptionId, 'expired', null);
        break;
      case 'PAYMENT.SALE.COMPLETED':
        // 续费成功，可在此刷新 current_period_end
        break;
      default:
        break;
    }

    return Response.json({ received: true });
  } catch (err: unknown) {
    console.error('[PayPal Webhook] Error:', err instanceof Error ? err.message : String(err));
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
