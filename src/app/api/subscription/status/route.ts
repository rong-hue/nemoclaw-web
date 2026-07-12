export const runtime = 'edge';
import { getServerUser } from '@/lib/supabase-auth';
import { subscriptionsService } from '@/lib/supabase';

export async function GET(req: Request) {
  try {
    const user = await getServerUser(req);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const sub = await subscriptionsService.getActiveByUser(user.id);
    if (!sub) {
      return Response.json({ plan: 'free', status: 'free' });
    }

    return Response.json({
      plan: sub.plan,
      status: sub.status,
      // paypal_subscription_id 不返回客户端，防止泄露敏感支付 ID
      current_period_end: sub.current_period_end,
      is_early_bird: sub.is_early_bird,
    });
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
