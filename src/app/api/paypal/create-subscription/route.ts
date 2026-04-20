export const runtime = 'edge';

import { subscriptionsService } from '@/lib/supabase';

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
  try {
    const { plan = 'early_bird', userId, userEmail } = await req.json() as {
      plan?: 'monthly' | 'yearly' | 'early_bird';
      userId: string;
      userEmail: string;
    };

    const planId = PLAN_IDS[plan];
    if (!planId) {
      return Response.json({ error: `Unknown plan: ${plan}` }, { status: 400 });
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
      const err = await subRes.text();
      return Response.json({ error: `PayPal subscription failed: ${err}` }, { status: 500 });
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
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: msg }, { status: 500 });
  }
}
