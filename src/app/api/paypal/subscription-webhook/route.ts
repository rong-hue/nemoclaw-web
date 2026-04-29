export const runtime = 'edge';

import { subscriptionsService } from '@/lib/supabase';

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

    console.log(`[PayPal Webhook] ${event_type} | sub=${subscriptionId}`);

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
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[PayPal Webhook] Error:', msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
