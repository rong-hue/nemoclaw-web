/**
 * Supabase Auth 统一认证层
 * 替代 localStorage auth 和 NextAuth
 */
import { createBrowserClient, createServerClient } from '@supabase/ssr';

export interface User {
  id: string;
  email: string;
  name?: string;
}

// 客户端 Supabase client（用于浏览器组件）
export function getSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// 服务端 Supabase client（用于 API Route / Server Component）
// 注意：Edge Runtime 需要传入 cookies 对象
export function getSupabaseServerClient(cookieStore: {
  get: (name: string) => { value: string | undefined } | undefined;
  set?: (opts: { name: string; value: string; [key: string]: unknown }) => void;
}) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          try {
            cookieStore.set?.({ name, value, ...options });
          } catch {
            // Server Component 中 set cookie 可能失败，忽略
          }
        },
        remove(name: string, options: Record<string, unknown>) {
          try {
            cookieStore.set?.({ name, value: '', ...options });
          } catch {
            // 忽略
          }
        },
      },
    }
  );
}

// 客户端认证操作
export const supabaseAuth = {
  // 邮箱/密码登录
  async signInWithPassword(email: string, password: string) {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  },

  // 邮箱/密码注册
  async signUp(email: string, password: string, name?: string) {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }, // 用户元数据
      },
    });
    if (error) throw error;
    return data.user;
  },

  // Google OAuth 登录
  async signInWithGoogle(redirectTo?: string) {
    const supabase = getSupabaseBrowserClient();
    // 从当前 URL 提取 locale（如 /en/auth → en）
    const locale = window.location.pathname.split('/')[1] || 'en';
    // OAuth 回调必须先到 /[locale]/auth/callback，再由它跳转到目标页
    const callbackUrl = `${window.location.origin}/${locale}/auth/callback?next=${encodeURIComponent(redirectTo || '/')}`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
      },
    });
    if (error) throw error;
    return data;
  },

  // 登出
  async signOut() {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // 获取当前用户（客户端）
  async getCurrentUser(): Promise<User | null> {
    const supabase = getSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    return {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name || user.email,
    };
  },

  // 监听认证状态变化
  onAuthStateChange(callback: (user: User | null) => void) {
    const supabase = getSupabaseBrowserClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        callback({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.name || session.user.email,
        });
      } else {
        callback(null);
      }
    });
    return subscription;
  },
};

// 服务端获取当前用户（用于 API Route / Edge Runtime）
export async function getServerUser(req: Request): Promise<User | null> {
  // Edge Runtime 中从 Request 读取 cookies
  const cookieHeader = req.headers.get('cookie') || '';
  const cookies: Record<string, string> = Object.fromEntries(
    cookieHeader
      .split('; ')
      .filter(Boolean)
      .map((c) => {
        const [key, ...v] = c.split('=');
        return [key, v.join('=')];
      })
  );

  const cookieStore = {
    get: (name: string) => ({ value: cookies[name] }),
  };

  const supabase = getSupabaseServerClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return {
    id: user.id,
    email: user.email!,
    name: user.user_metadata?.name || user.email,
  };
}
