export const runtime = 'edge';
import { getServerUser } from '@/lib/supabase-auth';
import { oracleService, subscriptionsService, FREE_DAILY_ORACLE_LIMIT, PRO_DAILY_ORACLE_LIMIT } from '@/lib/supabase';
import { generateOracleSeed, selectOracleText } from '@/lib/oracle-texts';

// GET /api/oracle/today
// 返回今日神谕（如果已生成则直接返回，未生成则调用 AI 生成）
export async function GET(req: Request) {
  try {
    // 1. 鉴权
    const user = await getServerUser(req);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = user.id;

    // 2. 查询今日神谕
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const existing = await oracleService.getTodayOracle(userId);

    if (existing) {
      // 已生成，直接返回
      return Response.json({
        oracle: existing,
        canRegenerate: existing.regenerate_count < (await isPro(userId) ? PRO_DAILY_ORACLE_LIMIT : FREE_DAILY_ORACLE_LIMIT),
      });
    }

    // 3. 未生成，调用 AI 生成
    const seed = generateOracleSeed(userId, today);
    const oracleText = selectOracleText(seed);

    // 调用 AI 生图 API（复用 ai-generate 的逻辑）
    const apiKey = process.env.SILICONFLOW_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'SILICONFLOW_API_KEY not configured' }, { status: 500 });
    }

    // 神谕风格：水墨氤氲 + 神秘意境
    const prompt = `${oracleText.en}, mystical oracle card, Chinese ink wash painting style, ethereal atmosphere, spiritual symbolism, minimalist composition, soft gradients, ancient wisdom aesthetic`;
    const negativePrompt = 'text, watermark, signature, blurry, low quality, photorealistic, western style';

    const res = await fetch('https://api.siliconflow.cn/v1/images/generations', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'Kwai-Kolors/Kolors',
        prompt,
        negative_prompt: negativePrompt,
        image_size: '512x512',
        num_inference_steps: 20,
        num_images: 1,
        seed: hashSeed(seed), // 确保同一天同一用户得到相同的图
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[Oracle] SiliconFlow error:', err);
      return Response.json({ error: 'Image generation failed' }, { status: 502 });
    }

    const data = await res.json() as { images: Array<{ url: string }> };
    const imageUrl = data.images?.[0]?.url;
    if (!imageUrl) {
      return Response.json({ error: 'No image returned' }, { status: 502 });
    }

    // 4. 保存到数据库
    const oracle = await oracleService.createOracle({
      user_id: userId,
      date: today,
      image_url: imageUrl,
      oracle_text: oracleText.zh,
      oracle_text_en: oracleText.en,
      seed,
    });

    return Response.json({
      oracle,
      canRegenerate: 0 < (await isPro(userId) ? PRO_DAILY_ORACLE_LIMIT : FREE_DAILY_ORACLE_LIMIT),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Oracle Today] Error:', msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}

// POST /api/oracle/today
// 重新生成今日神谕（Pro 用户每日最多 3 次）
export async function POST(req: Request) {
  try {
    // 1. 鉴权
    const user = await getServerUser(req);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = user.id;

    // 2. 检查配额
    const today = new Date().toISOString().split('T')[0];
    const existing = await oracleService.getTodayOracle(userId);
    if (!existing) {
      return Response.json({ error: 'No oracle to regenerate' }, { status: 400 });
    }

    const isPro = await isProUser(userId);
    const limit = isPro ? PRO_DAILY_ORACLE_LIMIT : FREE_DAILY_ORACLE_LIMIT;
    if (existing.regenerate_count >= limit) {
      return Response.json({ error: 'Regenerate limit reached', limit }, { status: 429 });
    }

    // 3. 生成新的神谕
    const newSeed = `${userId}-${today}-${existing.regenerate_count + 1}`;
    const oracleText = selectOracleText(newSeed);

    const apiKey = process.env.SILICONFLOW_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'SILICONFLOW_API_KEY not configured' }, { status: 500 });
    }

    const prompt = `${oracleText.en}, mystical oracle card, Chinese ink wash painting style, ethereal atmosphere, spiritual symbolism, minimalist composition, soft gradients, ancient wisdom aesthetic`;
    const negativePrompt = 'text, watermark, signature, blurry, low quality, photorealistic, western style';

    const res = await fetch('https://api.siliconflow.cn/v1/images/generations', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'Kwai-Kolors/Kolors',
        prompt,
        negative_prompt: negativePrompt,
        image_size: '512x512',
        num_inference_steps: 20,
        num_images: 1,
        seed: hashSeed(newSeed),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[Oracle Regenerate] SiliconFlow error:', err);
      return Response.json({ error: 'Image generation failed' }, { status: 502 });
    }

    const data = await res.json() as { images: Array<{ url: string }> };
    const imageUrl = data.images?.[0]?.url;
    if (!imageUrl) {
      return Response.json({ error: 'No image returned' }, { status: 502 });
    }

    // 4. 更新数据库
    const oracle = await oracleService.updateOracle(userId, today, {
      image_url: imageUrl,
      oracle_text: oracleText.zh,
      oracle_text_en: oracleText.en,
      seed: newSeed,
      regenerate_count: existing.regenerate_count + 1,
    });

    return Response.json({
      oracle,
      canRegenerate: oracle.regenerate_count < limit,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Oracle Regenerate] Error:', msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}

// 辅助函数：检查是否 Pro 用户
async function isProUser(userId: string): Promise<boolean> {
  const sub = await subscriptionsService.getActiveByUser(userId).catch(() => null);
  return !!sub;
}

async function isPro(userId: string): Promise<boolean> {
  return isProUser(userId);
}

// 辅助函数：将 seed 字符串转为数字（用于 AI 生图的 seed 参数）
function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}
