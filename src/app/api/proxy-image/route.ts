export const runtime = 'edge';

import { getServerUser } from '@/lib/supabase-auth';

// 统一白名单：与 validateImageUrl 保持一致
const ALLOWED_HOSTS = [
  'cdn.siliconflow.cn',
  'siliconflow.cn',
  'sf-maas-uat-prod.oss-cn-shanghai.aliyuncs.com',
  // SiliconFlow 其他 OSS 桶（*.aliyuncs.com 子域）
];
// 允许任意 aliyuncs.com 子域（与 input-validation.ts 中 ALLOWED_URL_DOMAINS 对齐）
function isAllowedHost(host: string): boolean {
  return (
    ALLOWED_HOSTS.some(h => host === h || host.endsWith('.' + h)) ||
    host.endsWith('.aliyuncs.com')
  );
}

// T-L5: 只允许透传实际图片类型
const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

export async function GET(req: Request) {
  // 鉴权：未登录用户不允许使用图片代理（防止匿名滥用带宽）
  const user = await getServerUser(req);
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const url = new URL(req.url).searchParams.get('url');
  if (!url) return new Response('Missing url', { status: 400 });

  // SSRF 防护：只允许白名单域名
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new Response('Invalid url', { status: 400 });
  }
  // 强制 HTTPS
  if (parsed.protocol !== 'https:') {
    return new Response('Forbidden', { status: 403 });
  }
  const host = parsed.hostname;
  if (!isAllowedHost(host)) {
    return new Response('Forbidden', { status: 403 });
  }

  try {
    // T-L5: 15秒超时（图片代理不需要 30s）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15_000);
    let res: Response;
    try {
      res = await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) return new Response('Fetch failed', { status: 502 });

    // T-L5: 验证响应 Content-Type 必须是图片类型
    const ct = res.headers.get('content-type') || '';
    const mime = ct.split(';')[0].trim();
    if (!ALLOWED_CONTENT_TYPES.includes(mime)) {
      return new Response('Forbidden content type', { status: 403 });
    }

    // CORS：只允许同站来源，不开放给任意第三方
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
    const corsOrigin = siteUrl || 'null'; // 无配置时不允许跨域

    const buf = await res.arrayBuffer();
    return new Response(buf, {
      headers: {
        'Content-Type': mime,
        'Access-Control-Allow-Origin': corsOrigin,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return new Response('Error', { status: 500 });
  }
}
