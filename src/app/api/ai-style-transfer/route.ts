export const runtime = 'edge';
import { getServerUser } from '@/lib/supabase-auth';
import { aiUsageService, subscriptionsService, FREE_DAILY_LIMIT, PRO_DAILY_LIMIT } from '@/lib/supabase';
import { validatePrompt, validateImageUrl } from '@/lib/input-validation';

// 场景2：图腾风格迁移 API — 用户上传图片，转换为东方美学风格
// POST /api/ai-style-transfer
// Body: { imageUrl, style, preserveSubject? }
//
// imageUrl:         用户上传的原图（宠物、人像、风景等）
// style:            'shuimo' | 'gongbi' | 'ukiyo' | 'cyberpunk' | 'liubai'
// preserveSubject:  是否保留原图主体构图（默认 true）

const STYLE_TRANSFER_PROMPTS: Record<string, string> = {
  shuimo: 'Transform this image into a traditional Chinese ink wash painting (水墨画). Use expressive monochrome ink gradients, misty atmospheric effects, rice paper texture. Preserve the subject but reinterpret in Song dynasty literati brushwork style. Negative space composition, poetic mood.',
  gongbi: 'Transform this image into Chinese gongbi fine brushwork painting (工笔画). Apply meticulous detailed line art, delicate mineral pigments, gold leaf accents. Tang and Song dynasty court aesthetic. Preserve subject with jewel-like color saturation on silk scroll texture.',
  ukiyo:  'Transform this image into Japanese ukiyo-e woodblock print style (浮世绘). Apply flat bold color areas, strong outlines, Hokusai and Hiroshige inspired. Edo period decorative aesthetic. Preserve the subject with limited color palette and ornamental composition.',
  cyberpunk: 'Transform this image into a cyber-orient fusion artwork. Merge Song dynasty ink painting aesthetics with cyberpunk neon elements. Add glowing circuit patterns, holographic overlays, neon light effects. Dark futuristic atmosphere with ink wash texture. Preserve subject identity.',
  liubai: 'Transform this image into a Zen minimalist ink painting (留白). Extreme negative space, single brushstroke interpretation, wabi-sabi aesthetic. Sparse composition on pale ink wash background. Meditative stillness. Preserve subject as minimal elegant form.',
};

export async function POST(req: Request) {
  try {
    // 1. 鉴权
    const user = await getServerUser(req);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. 配额检查（原子操作）
    let quotaResult: { allowed: boolean; used: number; limit: number };
    let activeSub: unknown;
    try {
      activeSub = await subscriptionsService.getActiveByUser(user.id).catch(() => null);
      const limit = activeSub ? PRO_DAILY_LIMIT : FREE_DAILY_LIMIT;
      quotaResult = await aiUsageService.incrementQuotaSafe(user.id, limit);
    } catch {
      return Response.json({ error: 'quota_check_failed' }, { status: 503 });
    }
    if (!quotaResult.allowed) {
      return Response.json({ error: 'quota_exceeded', used: quotaResult.used, limit: quotaResult.limit, isPro: !!activeSub }, { status: 429 });
    }

    // 3. 解析请求
    const { imageUrl, style = 'shuimo', preserveSubject = true } = await req.json() as {
      imageUrl: string;
      style?: string;
      preserveSubject?: boolean;
    };

    if (!imageUrl) {
      return Response.json({ error: 'imageUrl is required' }, { status: 400 });
    }
    const urlErr = validateImageUrl(imageUrl);
    if (!urlErr.ok) {
      return Response.json({ error: urlErr.error }, { status: 400 });
    }
    if (!STYLE_TRANSFER_PROMPTS[style]) {
      return Response.json({ error: `Unknown style: ${style}. Valid: shuimo, gongbi, ukiyo, cyberpunk, liubai` }, { status: 400 });
    }

    const apiKey = process.env.SILICONFLOW_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'SILICONFLOW_API_KEY not configured' }, { status: 500 });
    }

    // 4. 构建 prompt
    const subjectHint = preserveSubject ? ' Faithfully preserve the subject identity, pose, and composition.' : '';
    const fullPrompt = `${STYLE_TRANSFER_PROMPTS[style]}${subjectHint} Masterpiece quality, suitable for cultural merchandise printing. No text or watermarks.`;

    // 5. 调用 Qwen-Image-Edit-2509 进行风格迁移
    // SiliconFlow 统一使用 /v1/images/generations，传 image 参数实现图像编辑
    // L3: 30秒超时保护
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);
    let res: Response;
    try {
      res = await fetch('https://api.siliconflow.cn/v1/images/generations', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'Qwen/Qwen-Image-Edit-2509',
          prompt: fullPrompt,
          image: imageUrl,
          num_inference_steps: 20,
          guidance_scale: 4,
          negative_prompt: 'photorealistic, western style, low quality, blurry, watermark, text, signature, overexposed',
        }),
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) {
      const err = await res.text();
      console.error('[AI Style Transfer] SiliconFlow error:', err);
      return Response.json({ error: 'Style transfer failed' }, { status: 502 });
    }

    const data = await res.json() as { images: Array<{ url: string }> };
    const resultUrl = data.images?.[0]?.url;
    if (!resultUrl) {
      return Response.json({ error: 'No image returned' }, { status: 502 });
    }

    // 6. 记录使用（已在配额检查时原子写入，无需再次记录）

    return Response.json({
      url: resultUrl,
      style,
      used: quotaResult.used,
      limit: quotaResult.limit,
      isPro: !!activeSub,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[AI Style Transfer] Unhandled error:', msg);
    // Return JSON explicitly — never let edge runtime bubble up HTML
    return new Response(JSON.stringify({ error: 'Internal server error', detail: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
