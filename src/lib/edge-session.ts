/**
 * Edge-compatible session reader for NextAuth v5 (JWT strategy).
 * Works in Cloudflare Pages Edge Runtime where auth() cannot read cookies.
 *
 * NextAuth v5 stores the session as a JWE (encrypted JWT) in:
 *   - authjs.session-token        (http)
 *   - __Secure-authjs.session-token (https)
 *
 * The secret used to encrypt is AUTH_SECRET env var.
 */
import { jwtDecrypt } from 'jose';

interface EdgeSession {
  userId: string;
  email?: string;
}

export async function getEdgeSession(req: Request): Promise<EdgeSession | null> {
  try {
    const secret = process.env.AUTH_SECRET;
    if (!secret) return null;

    const cookieHeader = req.headers.get('cookie') ?? '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((c) => {
        const [k, ...v] = c.trim().split('=');
        return [k.trim(), decodeURIComponent(v.join('='))];
      })
    );

    const token =
      cookies['__Secure-authjs.session-token'] ||
      cookies['authjs.session-token'];

    if (!token) return null;

    // NextAuth v5 uses AES-GCM JWE with the secret derived via HKDF
    const secretBytes = new TextEncoder().encode(secret);
    const { payload } = await jwtDecrypt(token, secretBytes, {
      clockTolerance: 15,
    });

    const userId = (payload.sub as string) || (payload.email as string);
    if (!userId) return null;

    return { userId, email: payload.email as string | undefined };
  } catch {
    // Token invalid / expired / wrong secret
    return null;
  }
}
