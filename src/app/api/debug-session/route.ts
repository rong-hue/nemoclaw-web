export const runtime = 'edge';
import { getToken } from '@auth/core/jwt';

// GET /api/debug-session — 临时诊断 401 问题，确认后删除
export async function GET(req: Request) {
  const secret = process.env.AUTH_SECRET;
  const cookieHeader = req.headers.get('cookie') ?? '';
  const forwardedProto = req.headers.get('x-forwarded-proto');
  const url = new URL(req.url);

  // 列出所有 cookie 名称（不含值，安全）
  const cookieNames = cookieHeader
    .split(';')
    .map((c) => c.trim().split('=')[0])
    .filter(Boolean);

  // 尝试两种 secureCookie 模式
  let tokenSecure = null;
  let tokenInsecure = null;
  let errorSecure = '';
  let errorInsecure = '';

  if (secret) {
    try {
      tokenSecure = await getToken({ req, secret, secureCookie: true });
    } catch (e) {
      errorSecure = e instanceof Error ? e.message : String(e);
    }
    try {
      tokenInsecure = await getToken({ req, secret, secureCookie: false });
    } catch (e) {
      errorInsecure = e instanceof Error ? e.message : String(e);
    }
  }

  return Response.json({
    hasSecret: !!secret,
    secretLength: secret?.length ?? 0,
    reqUrl: req.url,
    protocol: url.protocol,
    hostname: url.hostname,
    forwardedProto,
    cookieNames,
    hasCookieSecure: cookieNames.includes('__Secure-authjs.session-token'),
    hasCookieInsecure: cookieNames.includes('authjs.session-token'),
    tokenSecure: tokenSecure ? { sub: tokenSecure.sub, email: tokenSecure.email } : null,
    tokenInsecure: tokenInsecure ? { sub: tokenInsecure.sub, email: tokenInsecure.email } : null,
    errorSecure,
    errorInsecure,
  });
}
