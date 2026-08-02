/**
 * 图片持久化工具
 *
 * 问题：SiliconFlow API 返回的是临时签名 URL（s3.siliconflow.cn/temporary/...），
 * 几小时/几天后就会过期。如果这些临时 URL 被保存到 canvas_json 或数据库，
 * 用户再次加载设计时图片就无法显示。
 *
 * 解决：在服务端将临时图片下载后转存到 Supabase Storage，返回永久公开 URL。
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'temp-uploads';

/**
 * 将临时图片 URL 转存到 Supabase Storage，返回永久公开 URL。
 * 如果原 URL 已经是公开 Supabase Storage URL 或 data URL，直接返回原 URL。
 *
 * @param imageUrl - SiliconFlow 或其他外部临时图片 URL
 * @param userId - 用户 ID（用于目录隔离）
 * @returns 永久公开 URL
 */
export async function persistImageToStorage(imageUrl: string, userId: string): Promise<string> {
  // data: URL 不需要转存
  if (imageUrl.startsWith('data:')) return imageUrl;

  // 已经是 Supabase Storage 公开 URL，不需要转存
  if (SUPABASE_URL && imageUrl.includes(SUPABASE_URL)) return imageUrl;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.warn('[image-persist] SUPABASE_URL or SERVICE_KEY not configured, returning original URL');
    return imageUrl;
  }

  try {
    // 1. 下载临时图片
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);
    let res: Response;
    try {
      res = await fetch(imageUrl, { signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) {
      console.error(`[image-persist] Failed to fetch image: ${res.status} ${res.statusText}`);
      return imageUrl; // 下载失败时返回原 URL 作为 fallback
    }

    const contentType = res.headers.get('content-type') || 'image/png';
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength === 0) {
      console.error('[image-persist] Downloaded empty image');
      return imageUrl;
    }

    // 2. 确定文件扩展名
    const extMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/svg+xml': 'svg',
    };
    const ext = extMap[contentType.split(';')[0].trim()] || 'png';

    // 3. 上传到 Supabase Storage
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${fileName}`;

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': contentType,
        'x-upsert': 'true',
      },
      body: buffer,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error(`[image-persist] Upload failed: ${errText}`);
      return imageUrl; // 上传失败时返回原 URL 作为 fallback
    }

    // 4. 返回永久公开 URL
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${fileName}`;
    console.log(`[image-persist] Persisted image: ${imageUrl.substring(0, 60)}... → ${publicUrl}`);
    return publicUrl;
  } catch (err) {
    console.error('[image-persist] Error:', err instanceof Error ? err.message : String(err));
    return imageUrl; // 任何异常时都返回原 URL 作为 fallback，避免中断业务流程
  }
}
