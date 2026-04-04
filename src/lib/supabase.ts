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
