import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const runtime = 'edge';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/';

  if (code) {
    const cookieStore = new Map<string, string>();

    // Parse existing cookies
    const cookieHeader = request.headers.get('cookie') || '';
    cookieHeader.split('; ').filter(Boolean).forEach(c => {
      const [k, ...v] = c.split('=');
      cookieStore.set(k, v.join('='));
    });

    const response = NextResponse.redirect(new URL(next, url.origin));

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => cookieStore.get(name),
          set: (name, value, options) => {
            response.cookies.set({ name, value, ...options });
          },
          remove: (name, options) => {
            response.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );

    await supabase.auth.exchangeCodeForSession(code);
    return response;
  }

  return NextResponse.redirect(new URL('/', url.origin));
}
