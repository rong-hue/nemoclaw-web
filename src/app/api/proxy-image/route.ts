export const runtime = 'edge';

const ALLOWED_HOSTS = ['cdn.siliconflow.cn', 'siliconflow.cn', 'sf-maas-uat-prod.oss-cn-shanghai.aliyuncs.com'];

export async function GET(req: Request) {
  const url = new URL(req.url).searchParams.get('url');
  if (!url) return new Response('Missing url', { status: 400 });

  // SSRF 防护：只允许白名单域名
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new Response('Invalid url', { status: 400 });
  }
  const host = parsed.hostname;
  if (!ALLOWED_HOSTS.some(h => host === h || host.endsWith('.' + h))) {
    return new Response('Forbidden', { status: 403 });
  }

  try {
    const res = await fetch(url);
    if (!res.ok) return new Response('Fetch failed', { status: 502 });
    const buf = await res.arrayBuffer();
    const ct = res.headers.get('content-type') || 'image/jpeg';
    return new Response(buf, {
      headers: {
        'Content-Type': ct,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return new Response('Error', { status: 500 });
  }
}
