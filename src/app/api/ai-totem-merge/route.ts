export const runtime = 'edge';
import { getServerUser } from '@/lib/supabase-auth';
import { aiUsageService, subscriptionsService, FREE_DAILY_LIMIT, PRO_DAILY_LIMIT } from '@/lib/supabase';
import { validateImageUrl } from '@/lib/input-validation';

// 场景1：图腾融合 API — 把设计图贴合到商品表面，生成真实印刷效果
// POST /api/ai-totem-merge
// Body: { productImageUrl, designImageUrl, productType, zone? }
//
// productImageUrl: 抠图后的商品底图（无背景，PNG）
// designImageUrl:  用户设计图（图腾）
// productType:     'tshirt' | 'mug' | 'phonecase' | 'totebag' | 'sticker'
// zone:            可选，印刷区域描述（如 'chest', 'outer-front'）

const PRODUCT_MERGE_PROMPTS: Record<string, string> = {
  tshirt:    'Seamlessly print the totem design onto the front of this t-shirt. The design should look naturally screen-printed, following the fabric texture and subtle wrinkles. Maintain the garment shape and lighting.',
  mug:       'Apply the totem design as a ceramic print on the mug surface. The artwork should wrap naturally around the cylindrical form, following the curvature. Keep the mug handle and form intact.',
  phonecase: 'Print the totem design onto the phone case back. The artwork should look like a professional UV print, crisp and vivid, following the case contours. Preserve the camera cutout area.',
  totebag:   'Screen-print the totem design onto the canvas tote bag surface. The design should look naturally printed on fabric, showing slight texture and material quality. Keep the bag handles and shape.',
  sticker:   'Apply the totem design as a high-quality vinyl sticker print. The artwork should appear crisp with clean edges, as if professionally printed and die-cut.',
};

export async function POST(req: Request) {
  try {
    // 1. 鉴权
    const user = await getServerUser(req);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. 配额检查（与 ai-generate 共享配额，原子操作）
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
    const { productImageUrl, designImageUrl, productType = 'tshirt', zone } = await req.json() as {
      productImageUrl: string;
      designImageUrl: string;
      productType?: string;
      zone?: string;
    };

    if (!productImageUrl || !designImageUrl) {
      return Response.json({ error: 'productImageUrl and designImageUrl are required' }, { status: 400 });
    }
    const urlErr1 = validateImageUrl(productImageUrl);
    if (urlErr1) return Response.json({ error: `productImageUrl: ${urlErr1}` }, { status: 400 });
    const urlErr2 = validateImageUrl(designImageUrl);
    if (urlErr2) return Response.json({ error: `designImageUrl: ${urlErr2}` }, { status: 400 });

    const apiKey = process.env.SILICONFLOW_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'SILICONFLOW_API_KEY not configured' }, { status: 500 });
    }

    // 4. 构建 prompt
    const basePrompt = PRODUCT_MERGE_PROMPTS[productType] ?? PRODUCT_MERGE_PROMPTS.tshirt;
    const zoneHint = zone ? ` Focus the design placement on the ${zone} area.` : '';
    const fullPrompt = `${basePrompt}${zoneHint} The result should look like a professional product mockup photo. High quality, photorealistic, no artifacts.`;

    // 5. 调用 Qwen-Image-Edit（多图输入：商品图 + 设计图）
    // 硅基流动 Qwen-Image-Edit 支持传入多张图，用 images 数组
    const res = await fetch('https://api.siliconflow.cn/v1/images/generations', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'Qwen/Qwen-Image-Edit',
        prompt: fullPrompt,
        image: productImageUrl,      // 主图：商品底图
        image_list: [designImageUrl], // 参考图：图腾设计图
        image_size: '512x512',
        num_inference_steps: 25,
        num_images: 1,
        guidance_scale: 7.5,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[AI Totem Merge] SiliconFlow error:', err);
      return Response.json({ error: 'Merge generation failed', detail: err }, { status: 502 });
    }

    const data = await res.json() as { images: Array<{ url: string }> };
    const imageUrl = data.images?.[0]?.url;
    if (!imageUrl) {
      return Response.json({ error: 'No image returned' }, { status: 502 });
    }

    // 6. 记录使用（已在配额检查时原子写入，无需再次记录）

    return Response.json({ url: imageUrl, used: quotaResult.used, limit: quotaResult.limit, isPro: !!activeSub });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[AI Totem Merge] Error:', msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
