export const runtime = 'edge';
import { getServerUser } from '@/lib/supabase-auth';
import { aiUsageService, subscriptionsService, FREE_MONTHLY_LIMIT, PRO_MONTHLY_LIMIT } from '@/lib/supabase';

// 场景3：个性化 AI Oracle 图 — 用户照片 → 个性化神谕图
// POST /api/ai-oracle-personal
// Body: { photoUrl, oracleText, mood?, element? }
//
// photoUrl:    用户上传的照片（人像/宠物/风景皆可）
// oracleText:  今日神谕文字（用于融入画面）
// mood:        'mystical' | 'serene' | 'fierce' | 'playful'（默认 mystical）
// element:     'water' | 'fire' | 'earth' | 'metal' | 'wood'（五行元素，可选）

const MOOD_PROMPTS: Record<string, string> = {
  mystical: 'Transform into a mystical Chinese oracle vision. Ethereal golden light, ancient symbols floating, cosmic energy swirling, divine prophecy atmosphere, celestial clouds, jade and gold tones.',
  serene:   'Transform into a serene Chinese landscape oracle. Misty mountains, flowing water, bamboo forest, meditation energy, peaceful dawn light, jade green and pearl white palette.',
  fierce:   'Transform into a fierce warrior oracle vision. Dragon energy, thunder and lightning, ancient armor motifs, crimson and gold, powerful protective spirit, battle-ready aura.',
  playful:  'Transform into a playful folk art oracle. Bright festive colors, paper-cut patterns, lucky symbols, lantern light, joyful energy, traditional folk aesthetic.',
};

const ELEMENT_OVERLAYS: Record<string, string> = {
  water: 'Incorporate flowing water, waves, and deep blue tones as the elemental energy.',
  fire:  'Incorporate flames, sparks, and warm crimson-orange tones as the elemental energy.',
  earth: 'Incorporate mountains, stone textures, and earthy brown-green tones as the elemental energy.',
  metal: 'Incorporate metallic sheen, sharp edges, and silver-gold tones as the elemental energy.',
  wood:  'Incorporate branches, leaves, and fresh green tones as the elemental energy.',
};

export async function POST(req: Request) {
  try {
    // 1. 鉴权
    const user = await getServerUser(req);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. 配额检查（个性化神谕消耗 2 次配额，因为效果更精细）
    let usedCount: number;
    let activeSub: unknown;
    try {
      [usedCount, activeSub] = await Promise.all([
        aiUsageService.getMonthlyCount(user.id),
        subscriptionsService.getActiveByUser(user.id).catch(() => null),
      ]);
    } catch {
      return Response.json({ error: 'quota_check_failed' }, { status: 503 });
    }
    const limit = activeSub ? PRO_MONTHLY_LIMIT : FREE_MONTHLY_LIMIT;
    // 个性化神谕消耗 2 次配额（Pro 功能增强）
    const COST = activeSub ? 1 : 2;
    if (usedCount + COST > limit) {
      return Response.json({ error: 'quota_exceeded', used: usedCount, limit, cost: COST, isPro: !!activeSub }, { status: 429 });
    }

    // 3. 解析请求
    const { photoUrl, oracleText, mood = 'mystical', element } = await req.json() as {
      photoUrl: string;
      oracleText?: string;
      mood?: string;
      element?: string;
    };

    if (!photoUrl) {
      return Response.json({ error: 'photoUrl is required' }, { status: 400 });
    }

    const apiKey = process.env.SILICONFLOW_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'SILICONFLOW_API_KEY not configured' }, { status: 500 });
    }

    // 4. 构建 prompt
    const moodPrompt = MOOD_PROMPTS[mood] ?? MOOD_PROMPTS.mystical;
    const elementHint = element && ELEMENT_OVERLAYS[element] ? ` ${ELEMENT_OVERLAYS[element]}` : '';
    const oracleHint = oracleText
      ? ` The overall composition should visually embody the feeling: "${oracleText}".`
      : '';

    const fullPrompt = `${moodPrompt}${elementHint}${oracleHint} Preserve the subject's essence and identity. Chinese cultural aesthetic, ink wash and gold leaf textures. Masterpiece quality oracle card art. No text overlay, no watermarks.`;

    // 5. 调用 Qwen-Image-Edit 生成个性化神谕图
    const res = await fetch('https://api.siliconflow.cn/v1/images/generations', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'Qwen/Qwen-Image-Edit',
        prompt: fullPrompt,
        image: photoUrl,
        image_size: '512x512',
        num_inference_steps: 30,  // 更多步数，质量更高
        num_images: 1,
        guidance_scale: 8.5,
        negative_prompt: 'ugly, deformed, photorealistic, western style, low quality, blurry, watermark, text, signature, modern, contemporary',
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[AI Oracle Personal] SiliconFlow error:', err);
      return Response.json({ error: 'Oracle generation failed', detail: err }, { status: 502 });
    }

    const data = await res.json() as { images: Array<{ url: string }> };
    const resultUrl = data.images?.[0]?.url;
    if (!resultUrl) {
      return Response.json({ error: 'No image returned' }, { status: 502 });
    }

    // 6. 记录使用（消耗 COST 次）
    const recordPromises = Array.from({ length: COST }, () =>
      aiUsageService.record(user.id).catch((e) => console.error('[AI Usage] record failed:', e))
    );
    await Promise.all(recordPromises);

    return Response.json({
      url: resultUrl,
      mood,
      element: element ?? null,
      used: usedCount + COST,
      limit,
      cost: COST,
      isPro: !!activeSub,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[AI Oracle Personal] Error:', msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
