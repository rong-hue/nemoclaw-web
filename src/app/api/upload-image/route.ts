export const runtime = 'edge';
import { getServerUser } from '@/lib/supabase-auth';
import { validateMagicBytes } from '@/lib/input-validation';

// POST /api/upload-image
// Accepts multipart/form-data with a "file" field (image/*)
// Uploads to Supabase Storage bucket: temp-uploads
// Returns: { url: string }

export async function POST(req: Request) {
  try {
    // 1. 鉴权
    const user = await getServerUser(req);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. 解析 multipart/form-data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    // 3. 校验类型和大小（10MB 上限）
    if (!file.type.startsWith('image/')) {
      return Response.json({ error: 'Only image files are allowed' }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return Response.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    // 3b. 文件头 magic bytes 验证（防止伪造 MIME type）
    const headerBytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const detectedMime = validateMagicBytes(headerBytes);
    if (!detectedMime) {
      return Response.json({ error: 'Invalid image file (unsupported format)' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      console.error('[Upload] SUPABASE_SERVICE_ROLE_KEY is not configured');
      return Response.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // 4. 生成唯一文件名
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const bucket = 'temp-uploads';

    // 5. 上传到 Supabase Storage（使用 REST API，兼容 Edge Runtime）
    const arrayBuffer = await file.arrayBuffer();
    const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${fileName}`;
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': file.type,
        'x-upsert': 'true',
      },
      body: arrayBuffer,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error('[upload-image] Supabase upload error:', errText);
      return Response.json({ error: 'Upload failed' }, { status: 502 });
    }

    // 6. 构造公开访问 URL
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${fileName}`;
    return Response.json({ url: publicUrl });
  } catch (err: unknown) {
    console.error('[upload-image] Error:', err instanceof Error ? err.message : String(err));
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
