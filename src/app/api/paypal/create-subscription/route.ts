export const runtime = 'edge';

import { subscriptionsService } from '@/lib/supabase';
import { getServerUser } from '@/lib/supabase-auth';

const PAYPAL_BASE = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

// Plan ID 映射
const PLAN_IDS: Record<string, string> = {
  monthly:    process.env.PAYPAL_PLAN_MONTHLY    ?? '',
  yearly:     process.env.PAYPAL_PLAN_YEARLY     ?? '',
  early_bird: process.env.PAYPAL_PLAN_EARLY_BIRD ?? '',
};

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
    const { plan = 'early_bird' } = await req.json() as {
      plan?: 'monthly' | 'yearly' | 'early_bird';
    };

    // 使用 JWT 里的 userId/email，不信任客户端传入
    const userId = user.id;
    const userEmail = user.email;

    const planId = PLAN_IDS[plan];
    if (!planId) {
      return Response.json({ error: 'Unknown plan' }, { status: 400 });
    }

    const accessToken = await getAccessToken();
    const origin = new URL(req.url).origin;

    const subRes = await fetch(`${PAYPAL_BASE}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `sub-${userId}-${Date.now()}`, // 幂等键
      },
      body: JSON.stringify({
        plan_id: planId,
        subscriber: {
          email_address: userEmail,
        },
        application_context: {
          brand_name: 'NemoClaw Culture',
          locale: 'en-US',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          return_url: `${origin}/en/subscription/success?plan=${plan}`,
          cancel_url: `${origin}/en/pricing?cancelled=1`,
        },
        custom_id: userId, // 存 userId，webhook 回调时用来关联用户
      }),
    });

    if (!subRes.ok) {
      console.error('[create-subscription] PayPal error:', await subRes.text());
      return Response.json({ error: 'Subscription creation failed' }, { status: 502 });
    }

    const sub = await subRes.json() as {
      id: string;
      links: Array<{ rel: string; href: string }>;
    };

    const approveLink = sub.links.find((l) => l.rel === 'approve')?.href;

    // 立即写入 pending 记录，webhook 激活后更新为 active
    try {
      await subscriptionsService.create({
        user_id: userId,
        user_email: userEmail,
        plan: plan as 'early_bird' | 'monthly' | 'yearly',
        paypal_subscription_id: sub.id,
      });
    } catch (dbErr) {
      // 不阻断主流程，记录日志即可
      console.error('[create-subscription] DB write failed:', dbErr);
    }

    return Response.json({
      subscriptionId: sub.id,
      approveUrl: approveLink,
    });
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
