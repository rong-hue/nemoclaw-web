export const runtime = 'edge';
import { getServerUser } from '@/lib/supabase-auth';
import { subscriptionsService } from '@/lib/supabase';
import { FREE_TALISMAN_ID } from '@/lib/talismans';

/**
 * POST /api/talisman/apply
 * 服务端验证护身符使用权限，防止前端绕过
 *
 * Body: { talismanId: string }
 * Response 200: { allowed: true }
 * Response 403: { allowed: false, error: string }
 */
export async function POST(req: Request) {
  try {
    // 1. 鉴权
    const user = await getServerUser(req);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. 解析请求体
    let talismanId: string;
    try {
      const body = await req.json();
      talismanId = body?.talismanId;
    } catch {
      return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    if (!talismanId || typeof talismanId !== 'string') {
      return Response.json({ error: 'talismanId is required' }, { status: 400 });
    }

    // 3. 检查用户套餐
    const sub = await subscriptionsService.getActiveByUser(user.id).catch(() => null);
    const isPro = !!sub;

    // 4. Free 用户只能使用 courage 护身符
    if (!isPro && talismanId !== FREE_TALISMAN_ID) {
      return Response.json(
        { allowed: false, error: 'Pro subscription required for this talisman' },
        { status: 403 }
      );
    }

    return Response.json({ allowed: true });
  } catch (err: unknown) {
    console.error('[Talisman Apply]', err instanceof Error ? err.message : String(err));
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
