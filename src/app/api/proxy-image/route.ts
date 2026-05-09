export const runtime = 'edge';

export async function GET(req: Request) {
  const url = new URL(req.url).searchParams.get('url');
  if (!url) return new Response('Missing url', { status: 400 });

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
