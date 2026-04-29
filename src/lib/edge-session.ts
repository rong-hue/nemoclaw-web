/**
 * Edge-compatible session reader for NextAuth v5 / Auth.js.
 *
 * Uses @auth/core's own getToken() which correctly handles:
 *   - HKDF key derivation (sha256, 64 bytes for A256CBC-HS512)
 *   - salt = cookie name
 *   - info = "Auth.js Generated Encryption Key (${salt})"
 *   - Both __Secure-authjs.session-token (https) and authjs.session-token (http)
 *
 * Works in Cloudflare Pages Edge Runtime — no Node.js APIs required.
 */
import { getToken } from '@auth/core/jwt';

interface EdgeSession {
  userId: string;
  email?: string;
}

export async function getEdgeSession(req: Request): Promise<EdgeSession | null> {
  try {
    const secret = process.env.AUTH_SECRET;
    if (!secret) {
      console.error('[EdgeSession] AUTH_SECRET is not set');
      return null;
    }

    // In Cloudflare Pages, req.url may be an internal URL (http://...) even on
    // production. Use x-forwarded-proto header first, then fall back to req.url.
    // Default to true (secure) so we read __Secure-authjs.session-token.
    const forwardedProto = req.headers.get('x-forwarded-proto');
    const url = new URL(req.url);
    const secureCookie =
      forwardedProto === 'https' ||
      url.protocol === 'https:' ||
      // If neither header nor URL tells us, assume production = secure
      (!forwardedProto && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1');

    // Try secure cookie first, then fall back to insecure (for local dev)
    let token = await getToken({ req, secret, secureCookie: true });
    if (!token) {
      token = await getToken({ req, secret, secureCookie: false });
    }

    if (!token) {
      console.error('[EdgeSession] No token found in cookies. secureCookie attempted:', secureCookie);
      return null;
    }

    // NextAuth v5: sub = providerAccountId (from jwt callback), email from profile
    const userId = (token.sub as string) || (token.email as string);
    if (!userId) {
      console.error('[EdgeSession] Token found but no sub/email:', JSON.stringify(token));
      return null;
    }

    return { userId, email: token.email as string | undefined };
  } catch (err) {
    console.error('[EdgeSession] Error:', err instanceof Error ? err.message : String(err));
    return null;
  }
}
