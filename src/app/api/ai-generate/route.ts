import { auth } from '@/auth';
import { aiUsageService, subscriptionsService, FREE_MONTHLY_LIMIT, PRO_MONTHLY_LIMIT } from '@/lib/supabase';

// SiliconFlow FLUX AI 生图 API — 带配额控制
// POST /api/ai-generate
// Body: { prompt, style?, width?, height? }

const STYLE_PROMPTS: Record<string, string> = {
  vintage: 'American vintage retro style, distressed texture, worn edges, classic americana, bold typography, 1950s-1970s aesthetic',
  streetwear: 'modern streetwear graphic, urban style, bold colors, graffiti influence, contemporary fashion illustration',
  minimalist: 'minimalist design, clean lines, simple geometric shapes, limited color palette, modern aesthetic',
  popArt: 'pop art style, bold outlines, bright saturated colors, halftone dots, Andy Warhol inspired, comic book aesthetic',
};

const NEGATIVE_PROMPT = 'blurry, low quality, text, watermark, signature, cropped, oversaturated, ugly, deformed, extra limbs, bad anatomy, duplicate';

export async function POST(req: Request) {
  try {
    // 1. 鉴权
    const session = await auth();
    if (!session?.user?.id && !session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id || session.user.email!;

    // 2. 配额检查
    const [usedCount, activeSub] = await Promise.all([
      aiUsageService.getMonthlyCount(userId).catch(() => 0),
      subscriptionsService.getActiveByUser(userId).catch(() => null),
    ]);
    const limit = activeSub ? PRO_MONTHLY_LIMIT : FREE_MONTHLY_LIMIT;
    if (usedCount >= limit) {
      return Response.json(
        { error: 'quota_exceeded', used: usedCount, limit, isPro: !!activeSub },
        { status: 429 }
      );
    }

    // 3. 解析请求
    const { prompt, style, width = 512, height = 512 } = await req.json() as {
      prompt: string; style?: string; width?: number; height?: number;
    };
    if (!prompt?.trim()) {
      return Response.json({ error: 'prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.SILICONFLOW_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'SILICONFLOW_API_KEY not configured' }, { status: 500 });
    }

    // 4. 调用 AI
    const stylePrefix = style && STYLE_PROMPTS[style] ? `${STYLE_PROMPTS[style]}, ` : '';
    const fullPrompt = `${stylePrefix}${prompt}, high quality, detailed, suitable for t-shirt print design, transparent background preferred`;

    const res = await fetch('https://api.siliconflow.cn/v1/images/generations', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'Kwai-Kolors/Kolors',
        prompt: fullPrompt,
        negative_prompt: NEGATIVE_PROMPT,
        image_size: `${width}x${height}`,
        num_inference_steps: 20,
        num_images: 1,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[AI Generate] SiliconFlow error:', err);
      return Response.json({ error: 'Image generation failed' }, { status: 502 });
    }

    const data = await res.json() as { images: Array<{ url: string }> };
    const imageUrl = data.images?.[0]?.url;
    if (!imageUrl) {
      return Response.json({ error: 'No image returned' }, { status: 502 });
    }

    // 5. 记录使用（生图成功后才计数）
    await aiUsageService.record(userId).catch((e) => console.error('[AI Usage] record failed:', e));

    return Response.json({ url: imageUrl, used: usedCount + 1, limit, isPro: !!activeSub });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[AI Generate] Error:', msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
