import { createBrowserClient } from '@supabase/ssr';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
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

  // 保存/更新设计
  async save(design: {
    id?: string;
    user_id: string;
    user_email?: string;
    title: string;
    canvas_json: string;
    preview_url?: string;
  }) {
    const supabase = getSupabaseClient();
    if (design.id) {
      // 更新
      const { data, error } = await supabase
        .from('designs')
        .update({
          title: design.title,
          canvas_json: design.canvas_json,
          preview_url: design.preview_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', design.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      // 新建
      const { data, error } = await supabase
        .from('designs')
        .insert(design)
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
    const supabase = getSupabaseClient();
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
