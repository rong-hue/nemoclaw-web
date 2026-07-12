import { createClient } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase-auth';

/**
 * 服务端专用 Supabase client（使用 service_role key，绕过 RLS）
 * 只在 API Route / Server Component 中调用，不要在客户端使用
 */
function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured. Check environment variables.');
  }
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

  // 查询用户当前设计数量
  async getCount(userId: string): Promise<number> {
    const supabase = getSupabaseClient();
    const { count, error } = await supabase
      .from('designs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    if (error) throw error;
    return count ?? 0;
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
    canvas_json: object; // 直接接受对象
    preview_url?: string;
  }) {
    const supabase = getSupabaseClient();
    if (design.id) {
      // 更新
      const { data, error } = await supabase
        .from('designs')
        .update({
          title: design.title,
          canvas_json: design.canvas_json, // 已经是对象
          preview_url: design.preview_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', design.id)
        .select('*')
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
          canvas_json: design.canvas_json, // 已经是对象
          preview_url: design.preview_url, // 新建时也要保存缩略图
        })
        .select('*')
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
  // 根据 PayPal subscription_id 查找记录（服务端专用，走 service_role 绕过 RLS）
  async getByPaypalId(paypalSubscriptionId: string) {
    const supabase = getServiceClient();
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

  // 更新订阅状态（webhook 专用，走 service_role 确保有写权限）
  async updateStatus(
    paypalSubscriptionId: string,
    status: 'active' | 'cancelled' | 'expired',
    currentPeriodEnd?: string | null
  ) {
    const supabase = getServiceClient();
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
//   create policy "insert" on ai_usage for insert with check (auth.uid()::text = user_id);
//   create policy "select" on ai_usage for select using (auth.uid()::text = user_id);

export const FREE_DAILY_LIMIT = 1;
export const PRO_DAILY_LIMIT = 6;

// 设计作品保存数量上限
export const FREE_DESIGNS_LIMIT = 10;
export const PRO_DESIGNS_LIMIT = 200;

export const aiUsageService = {
  /** 查询用户今日已用次数（在 API Route 服务端调用） */
  async getDailyCount(userId: string): Promise<number> {
    const supabase = getServiceClient();
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const { count, error } = await supabase
      .from('ai_usage')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', start.toISOString());
    if (error) throw error;
    return count ?? 0;
  },

  /** @deprecated 用 getDailyCount 替代 */
  async getMonthlyCount(userId: string): Promise<number> {
    return this.getDailyCount(userId);
  },

  /** 记录一次使用（在 API Route 服务端调用） */
  async record(userId: string, type = 'generate'): Promise<void> {
    const supabase = getServiceClient();
    const { error } = await supabase.from('ai_usage').insert({ user_id: userId, type });
    if (error) throw error;
  },

  /**
   * 原子配额检查 + 写入（方案1：Supabase RPC 存储过程）
   *
   * 返回 { allowed: boolean; used: number; limit: number }
   * - allowed=true：配额充足，已原子写入一条记录
   * - allowed=false：配额已满，未写入
   *
   * 需要先在 Supabase SQL Editor 执行一次建表脚本（见下方注释）
   *
   * -- =====================================================
   * -- 在 Supabase SQL Editor 执行（仅需执行一次）：
   * -- =====================================================
   * -- create or replace function increment_quota_safe(
   * --   p_user_id  text,
   * --   p_limit    int,
   * --   p_type     text default 'generate',
   * --   p_cost     int  default 1
   * -- )
   * -- returns jsonb
   * -- language plpgsql
   * -- security definer
   * -- as $$
   * -- declare
   * --   v_today_start  timestamptz := date_trunc('day', now() at time zone 'UTC');
   * --   v_used         int;
   * -- begin
   * --   -- 行级锁：锁定该用户今日的所有记录，防止并发写入竞争
   * --   select count(*) into v_used
   * --   from ai_usage
   * --   where user_id = p_user_id
   * --     and created_at >= v_today_start
   * --   for update;
   * --
   * --   if v_used + p_cost > p_limit then
   * --     return jsonb_build_object('allowed', false, 'used', v_used, 'limit', p_limit);
   * --   end if;
   * --
   * --   -- 原子插入 p_cost 条记录
   * --   insert into ai_usage (user_id, type)
   * --   select p_user_id, p_type
   * --   from generate_series(1, p_cost);
   * --
   * --   return jsonb_build_object('allowed', true, 'used', v_used + p_cost, 'limit', p_limit);
   * -- end;
   * -- $$;
   * -- =====================================================
   */
  async incrementQuotaSafe(
    userId: string,
    limit: number,
    type = 'generate',
    cost = 1
  ): Promise<{ allowed: boolean; used: number; limit: number }> {
    const supabase = getServiceClient();
    const { data, error } = await supabase.rpc('increment_quota_safe', {
      p_user_id: userId,
      p_limit: limit,
      p_type: type,
      p_cost: cost,
    });
    if (error) throw error;
    return data as { allowed: boolean; used: number; limit: number };
  },
};

// ── Oracle 神谕相关操作 ──────────────────────────────────────────────────────
// -- Run this in Supabase SQL Editor:
// -- create or replace function increment_oracle_regenerate_safe(
// --   p_user_id text,
// --   p_limit   int
// -- ) returns jsonb language plpgsql security definer as $$
// -- declare
// --   v_today text := to_char(now() at time zone 'UTC', 'YYYY-MM-DD');
// --   v_count int;
// -- begin
// --   select regenerate_count into v_count
// --   from oracle_logs
// --   where user_id = p_user_id and date = v_today
// --   for update;
// --   if v_count is null then
// --     return jsonb_build_object('allowed', false, 'regenerate_count', 0);
// --   end if;
// --   if v_count >= p_limit then
// --     return jsonb_build_object('allowed', false, 'regenerate_count', v_count);
// --   end if;
// --   update oracle_logs
// --   set regenerate_count = regenerate_count + 1
// --   where user_id = p_user_id and date = v_today;
// --   return jsonb_build_object('allowed', true, 'regenerate_count', v_count + 1);
// -- end; $$;
export const FREE_DAILY_ORACLE_LIMIT = 1;
export const PRO_DAILY_ORACLE_LIMIT = 6;

export const oracleService = {
  /** 获取用户今日神谕（如果存在） */
  async getTodayOracle(userId: string): Promise<any | null> {
    const supabase = getServiceClient();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const { data, error } = await supabase
      .from('oracle_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return data;
  },

  /** 创建今日神谕记录 */
  async createOracle(oracle: {
    user_id: string;
    date: string;
    image_url: string;
    oracle_text: string;
    oracle_text_en: string;
    seed: string;
  }) {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('oracle_logs')
      .insert(oracle)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** 根据 ID 获取神谕记录 */
  async getOracleById(id: string): Promise<any | null> {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('oracle_logs')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * 原子检查 regenerate_count 并递增（防并发双击绕过限制）
   * 需先在 Supabase SQL Editor 执行上方注释中的建函数 SQL
   */
  async incrementRegenerateSafe(
    userId: string,
    limit: number
  ): Promise<{ allowed: boolean; regenerate_count: number }> {
    const supabase = getServiceClient();
    const { data, error } = await supabase.rpc('increment_oracle_regenerate_safe', {
      p_user_id: userId,
      p_limit: limit,
    });
    if (error) throw error;
    return data as { allowed: boolean; regenerate_count: number };
  },

  /** 更新神谕（重新生成） */
  async updateOracle(userId: string, date: string, updates: {
    image_url: string;
    oracle_text: string;
    oracle_text_en: string;
    seed: string;
    regenerate_count: number;
  }) {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('oracle_logs')
      .update(updates)
      .eq('user_id', userId)
      .eq('date', date)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
