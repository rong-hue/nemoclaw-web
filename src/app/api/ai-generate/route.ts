export const runtime = 'edge';
import { getServerUser } from '@/lib/supabase-auth';
import { aiUsageService, subscriptionsService, FREE_MONTHLY_LIMIT, PRO_MONTHLY_LIMIT } from '@/lib/supabase';

// SiliconFlow FLUX AI 生图 API — 带配额控制
// POST /api/ai-generate
// Body: { prompt, style?, width?, height? }

// 东方美学词库 — 每个风格的核心视觉语言
const STYLE_PROMPTS: Record<string, string> = {
  // 水墨氤氲：大写意，墨气淋漓
  shuimo: 'Chinese ink wash painting, shuimo xieyi style, monochrome ink gradients, expressive spontaneous brushstrokes, misty atmospheric perspective, rice paper texture, negative space composition, poetic and melancholic mood, Song dynasty literati aesthetic',
  // 工笔细描：精细勾勒，矿物色彩
  gongbi: 'Chinese gongbi fine brushwork painting, meticulous detailed line art, delicate mineral pigments, gold leaf accents, Tang and Song dynasty court aesthetic, elegant floral bird and figure motifs, silk scroll texture, jewel-like color saturation',
  // 浮世绘版画：平涂色块，装饰性强
  ukiyo: 'Japanese ukiyo-e woodblock print, flat bold color areas, strong outlines, Hokusai and Hiroshige inspired, Edo period aesthetic, decorative wave and nature patterns, limited color palette, graphic and ornamental composition',
  // 赛博国风：霓虹灯笼 + 机械山水
  cyberpunk: 'cyber orient fusion, Song dynasty ink painting meets cyberpunk neon, glowing neon lanterns and holographic pavilions, circuit-pattern bamboo forest, mechanical dragon motifs, rain-soaked night market, dark futuristic atmosphere with ink wash texture overlay',
  // 留白极简：禅意，计白当黑
  liubai: 'Zen minimalist ink painting, extreme negative space, single brushstroke subject, wabi-sabi aesthetic, sparse composition, pale ink wash background, meditative stillness, haiku visual poetry, monochrome with subtle warm tone',
  // 保留旧风格兼容
  vintage: 'American vintage retro style, distressed texture, worn edges, classic americana, bold typography, 1950s-1970s aesthetic',
  streetwear: 'modern streetwear graphic, urban style, bold colors, graffiti influence, contemporary fashion illustration',
  minimalist: 'minimalist design, clean lines, simple geometric shapes, limited color palette, modern aesthetic',
  popArt: 'pop art style, bold outlines, bright saturated colors, halftone dots, Andy Warhol inspired, comic book aesthetic',
};

// 东方美学风格集合（用于判断是否追加文创品质量后缀）
const EASTERN_STYLES = new Set(['shuimo', 'gongbi', 'ukiyo', 'cyberpunk', 'liubai']);

const NEGATIVE_PROMPT = 'blurry, low quality, text, watermark, signature, cropped, oversaturated, ugly, deformed, extra limbs, bad anatomy, duplicate, western style, photorealistic';

export async function POST(req: Request) {
  try {
    // 1. 鉴权 — 从 Supabase Auth JWT 读取用户
    const user = await getServerUser(req);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = user.id;

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
    const isEastern = EASTERN_STYLES.has(style ?? '');
    const qualitySuffix = isEastern
      ? ', masterpiece, high quality, suitable for cultural merchandise printing, elegant artistic composition, fine art'
      : ', high quality, detailed, suitable for t-shirt print design, transparent background preferred';
    const fullPrompt = `${stylePrefix}${prompt}${qualitySuffix}`;

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
