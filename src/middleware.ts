import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

// Routes that require authentication (without locale prefix)
const PROTECTED_PATHS = ['/dashboard', '/studio', '/oracle'];

// Public paths that are never protected
const PUBLIC_PATHS = [
  '/auth',
  '/pricing',
  '/about',
  '/faq',
  '/contact',
  '/terms',
  '/privacy',
  '/dmca',
  '/blog',
  '/gallery',
];

function getLocaleAndPath(pathname: string): { locale: string; path: string } {
  const locales = routing.locales as readonly string[];
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0 && locales.includes(segments[0])) {
    const locale = segments[0];
    const path = '/' + segments.slice(1).join('/');
    return { locale, path: path || '/' };
  }
  return { locale: routing.defaultLocale, path: pathname };
}

function isProtectedPath(path: string): boolean {
  return PROTECTED_PATHS.some(
    (p) => path === p || path.startsWith(p + '/')
  );
}

function isPublicPath(path: string): boolean {
  if (path === '/') return true;
  return PUBLIC_PATHS.some(
    (p) => path === p || path.startsWith(p + '/')
  );
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always let next-intl handle its routing first for non-API paths
  // API routes, static files are excluded by the matcher

  const { locale, path } = getLocaleAndPath(pathname);

  // Only check auth for protected paths
  if (!isProtectedPath(path)) {
    return intlMiddleware(req);
  }

  // Public paths (safety check — shouldn't reach here given PROTECTED_PATHS logic)
  if (isPublicPath(path)) {
    return intlMiddleware(req);
  }

  // Auth check via Supabase SSR client
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase env vars (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY) are not configured.');
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          req.cookies.set({ name, value, ...(options as object) });
          response = NextResponse.next({
            request: { headers: req.headers },
          });
          response.cookies.set({ name, value, ...(options as object) });
        },
        remove(name: string, options: Record<string, unknown>) {
          req.cookies.set({ name, value: '', ...(options as object) });
          response = NextResponse.next({
            request: { headers: req.headers },
          });
          response.cookies.set({ name, value: '', ...(options as object) });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Redirect to /{locale}/auth with redirectTo param
    const redirectTo = encodeURIComponent(pathname);
    const authUrl = new URL(`/${locale}/auth`, req.url);
    authUrl.searchParams.set('redirectTo', redirectTo);
    return NextResponse.redirect(authUrl);
  }

  // User is authenticated — let intl middleware continue
  return intlMiddleware(req);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
