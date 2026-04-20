export const runtime = 'edge';

import { subscriptionsService } from '@/lib/supabase';

// PayPal Webhook 事件处理
// 在 PayPal Developer 控制台配置 Webhook URL：
// https://your-domain.com/api/paypal/subscription-webhook
// 订阅事件：BILLING.SUBSCRIPTION.ACTIVATED / CANCELLED / EXPIRED

export async function POST(req: Request) {
  try {
    const event = await req.json() as {
      event_type: string;
      resource: {
        id: string;           // subscription_id
        custom_id?: string;   // userId（create-subscription 时传入）
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
        // 续费成功 → 刷新 current_period_end（PayPal 不直接给，用当前时间+1月估算）
        // 真实场景可调 GET /v1/billing/subscriptions/{id} 获取最新 next_billing_time
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
