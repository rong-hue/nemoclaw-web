export const runtime = 'edge';

// PayPal Webhook 事件处理
// 在 PayPal Developer 控制台配置 Webhook URL：
// https://your-domain.com/api/paypal/subscription-webhook
// 订阅事件：BILLING.SUBSCRIPTION.ACTIVATED / CANCELLED / EXPIRED / PAYMENT.SALE.COMPLETED

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
    const userId = resource.custom_id;

    console.log(`[PayPal Webhook] ${event_type} | sub=${subscriptionId} | user=${userId}`);

    // TODO: 根据 event_type 更新 Supabase subscriptions 表
    // 推荐在此处调用 Supabase Admin API（service_role key）
    switch (event_type) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        // 订阅激活 → 写入/更新 subscriptions 表，status='active'
        // await updateSubscription(userId, subscriptionId, 'active', resource.billing_info?.next_billing_time)
        break;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.EXPIRED':
        // 订阅取消/到期 → status='cancelled'
        // await updateSubscription(userId, subscriptionId, 'cancelled', null)
        break;

      case 'PAYMENT.SALE.COMPLETED':
        // 每次续费成功 → 可记录到 orders 表
        break;

      default:
        // 其他事件忽略
        break;
    }

    return Response.json({ received: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[PayPal Webhook] Error:', msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
