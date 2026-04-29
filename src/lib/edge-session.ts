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
    if (!secret) return null;

    // Detect https vs http to pick the right cookie name
    const url = new URL(req.url);
    const secureCookie = url.protocol === 'https:';

    const token = await getToken({
      req,
      secret,
      secureCookie,
    });

    if (!token) return null;

    // NextAuth v5: sub = providerAccountId (from jwt callback), email from profile
    const userId = (token.sub as string) || (token.email as string);
    if (!userId) return null;

    return { userId, email: token.email as string | undefined };
  } catch {
    return null;
  }
}
