export const runtime = 'edge';

import { getServerUser } from '@/lib/supabase-auth';
import { subscriptionsService } from '@/lib/supabase';

const PAYPAL_BASE = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getAccessToken(): Promise<string> {
  const credentials = btoa(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  );
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`PayPal auth failed: ${await res.text()}`);
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

export async function POST(req: Request) {
  // N-M1: 鉴权，必须登录
  const user = await getServerUser(req);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // 从数据库获取该用户的订阅 ID，不信任客户端传入
    const sub = await subscriptionsService.getActiveByUser(user.id);
    if (!sub?.paypal_subscription_id) {
      return Response.json({ error: 'No active subscription found' }, { status: 404 });
    }
    const subscriptionId = sub.paypal_subscription_id;

    const accessToken = await getAccessToken();

    const res = await fetch(
      `${PAYPAL_BASE}/v1/billing/subscriptions/${subscriptionId}/cancel`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'User requested cancellation' }),
      }
    );

    // PayPal 取消成功返回 204 No Content
    if (res.status === 204) {
      return Response.json({ success: true });
    }

    console.error('[cancel-subscription] PayPal error:', await res.text());
    return Response.json({ error: 'Cancellation failed' }, { status: 502 });
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
