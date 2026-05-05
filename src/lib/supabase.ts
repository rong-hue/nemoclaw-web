import { createClient } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase-auth';

/**
 * 服务端专用 Supabase client（使用 service_role key，绕过 RLS）
 * 只在 API Route / Server Component 中调用，不要在客户端使用
 */
function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  // 优先用 service_role key（服务端），没有则降级到 anon key（开发环境）
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}

// 客户端操作统一使用 supabase-auth.ts 里的 client，确保 session 共享
function getSupabaseClient() {
  return getSupabaseBrowserClient();
}

// 设计作品相关操作
export const designsService = {
  // 获取用户所有设计
  async getByUser(userId: string) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('designs')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // 根据 ID 获取单个设计
  async getById(id: string) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('designs')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  // 保存/更新设计
  async save(design: {
    id?: string;
    user_id: string;
    user_email?: string;
    title: string;
    canvas_data: string;
    preview_url?: string;
  }) {
    const supabase = getSupabaseClient();
    if (design.id) {
      // 更新
      const { data, error } = await supabase
        .from('designs')
        .update({
          title: design.title,
          canvas_data: design.canvas_data,
          preview_url: design.preview_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', design.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      // 新建（只传表中存在的字段）
      const { data, error } = await supabase
        .from('designs')
        .insert({
          user_id: design.user_id,
          title: design.title,
          canvas_data: design.canvas_data,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  // 删除设计
  async delete(id: string) {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('designs')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// 订单相关操作
export const ordersService = {
  // 获取用户所有订单
  async getByUser(userId: string) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // 创建订单
  async create(order: {
    user_id: string;
    user_email?: string;
    items: any[];
    total: number;
    shipping_info?: any;
  }) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('orders')
      .insert(order)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// 订阅相关操作（服务端用 service_role key，客户端用 anon key 只读）
export const subscriptionsService = {
  // 根据 PayPal subscription_id 查找记录
  async getByPaypalId(paypalSubscriptionId: string) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('paypal_subscription_id', paypalSubscriptionId)
      .single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return data;
  },

  // 根据 user_id 查找当前有效订阅
  async getActiveByUser(userId: string) {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // 创建订阅记录（用户点击订阅后立即写入 pending）
  async create(sub: {
    user_id: string;
    user_email?: string;
    plan: 'early_bird' | 'monthly' | 'yearly';
    paypal_subscription_id: string;
  }) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        ...sub,
        status: 'pending',
        is_early_bird: sub.plan === 'early_bird',
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // 更新订阅状态（webhook 调用）
  async updateStatus(
    paypalSubscriptionId: string,
    status: 'active' | 'cancelled' | 'expired',
    currentPeriodEnd?: string | null
  ) {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status,
        current_period_end: currentPeriodEnd ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('paypal_subscription_id', paypalSubscriptionId);
    if (error) throw error;
  },
};

// ── AI 使用配额 ──────────────────────────────────────────────────────────────
// Supabase 建表 SQL（在 SQL Editor 执行一次）：
//   create table if not exists ai_usage (
//     id uuid primary key default gen_random_uuid(),
//     user_id text not null,
//     type text not null default 'generate',
//     created_at timestamptz not null default now()
//   );
//   create index if not exists ai_usage_user_created on ai_usage (user_id, created_at);
//   alter table ai_usage enable row level security;
//   create policy "insert" on ai_usage for insert with check (true);
//   create policy "select" on ai_usage for select using (true);

export const FREE_MONTHLY_LIMIT = 3;
export const PRO_MONTHLY_LIMIT = 50;

export const aiUsageService = {
  /** 查询用户本月已用次数（在 API Route 服务端调用） */
  async getMonthlyCount(userId: string): Promise<number> {
    const supabase = getServiceClient();
    const start = new Date();
    start.setDate(1); start.setHours(0, 0, 0, 0);
    const { count, error } = await supabase
      .from('ai_usage')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', start.toISOString());
    if (error) throw error;
    return count ?? 0;
  },

  /** 记录一次使用（在 API Route 服务端调用） */
  async record(userId: string, type = 'generate'): Promise<void> {
    const supabase = getServiceClient();
    const { error } = await supabase.from('ai_usage').insert({ user_id: userId, type });
    if (error) throw error;
  },
};
