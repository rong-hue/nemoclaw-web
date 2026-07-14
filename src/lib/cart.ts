/**
 * 购物车管理 — Supabase 持久化
 * 替代 localStorage 方案，支持跨设备同步
 *
 * Supabase 建表 SQL（在 SQL Editor 执行一次）：
 *   create table if not exists carts (
 *     id uuid primary key default gen_random_uuid(),
 *     user_id text not null unique,
 *     items jsonb not null default '[]'::jsonb,
 *     updated_at timestamptz not null default now()
 *   );
 *   alter table carts enable row level security;
 *   -- RLS：用户只能读写自己的购物车
 *   create policy "select_own" on carts for select using (auth.uid()::text = user_id);
 *   create policy "insert_own" on carts for insert with check (auth.uid()::text = user_id);
 *   create policy "update_own" on carts for update using (auth.uid()::text = user_id);
 *   create policy "delete_own" on carts for delete using (auth.uid()::text = user_id);
 *   create index if not exists carts_user_id on carts (user_id);
 */

import { getSupabaseBrowserClient } from '@/lib/supabase-auth';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

// ── 兼容旧 localStorage 的迁移 ────────────────────────────────────────
const LOCAL_CART_KEY = 'cart';
const MIGRATED_KEY = 'cart_migrated_to_supabase';

function getLocalCart(): CartItem[] | null {
  try {
    const raw = localStorage.getItem(LOCAL_CART_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearLocalCart() {
  try { localStorage.removeItem(LOCAL_CART_KEY); } catch { /* noop */ }
  try { localStorage.setItem(MIGRATED_KEY, '1'); } catch { /* noop */ }
}

// ── Supabase CRUD ────────────────────────────────────────────────────

type CartRow = { user_id: string; items: CartItem[]; updated_at: string };

async function readFromDb(userId: string): Promise<CartItem[]> {
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase
    .from('carts')
    .select('items')
    .eq('user_id', userId)
    .maybeSingle();
  return (data?.items as CartItem[]) ?? [];
}

async function writeToDb(userId: string, items: CartItem[]): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from('carts')
    .upsert({ user_id: userId, items, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) throw error;
}

// ── 公开 API（兼容旧 cartService 接口）───────────────────────────────

let cachedUserId: string | null = null;
let cachedItems: CartItem[] | null = null;

/** 设置当前用户 ID（登录后调用一次），触发 localStorage→Supabase 迁移 */
export async function initCart(userId: string | null): Promise<void> {
  cachedUserId = userId;
  cachedItems = null; // 重置缓存，下次 getCart 会重新拉取

  if (!userId) {
    // 未登录 → 降级到 localStorage
    return;
  }

  // 迁移：如果 localStorage 有旧数据且尚未迁移，合并到 Supabase
  const alreadyMigrated = (() => {
    try { return localStorage.getItem(MIGRATED_KEY) === '1'; } catch { return false; }
  })();

  if (!alreadyMigrated) {
    const local = getLocalCart();
    if (local && local.length > 0) {
      const dbItems = await readFromDb(userId);
      // 合并：去重（按 id）
      const merged = [...dbItems];
      for (const item of local) {
        if (!merged.find(m => m.id === item.id)) {
          merged.push(item);
        }
      }
      await writeToDb(userId, merged);
    }
    clearLocalCart();
  }
}

export const cartService = {
  async getCart(): Promise<CartItem[]> {
    const userId = cachedUserId;
    if (!userId) {
      // 未登录 → localStorage 降级
      try {
        const raw = localStorage.getItem(LOCAL_CART_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch { return []; }
    }
    if (cachedItems !== null) return cachedItems;
    try {
      cachedItems = await readFromDb(userId);
    } catch {
      cachedItems = [];
    }
    return cachedItems;
  },

  async addItem(item: Omit<CartItem, 'quantity'>): Promise<void> {
    const cart = await cartService.getCart();
    const existing = cart.find(i => i.id === item.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ ...item, quantity: 1 });
    }
    await cartService._persist(cart);
  },

  async updateQuantity(id: string, quantity: number): Promise<void> {
    const cart = await cartService.getCart();
    const item = cart.find(i => i.id === id);
    if (item) {
      item.quantity = Math.max(1, quantity);
      await cartService._persist(cart);
    }
  },

  async removeItem(id: string): Promise<void> {
    const cart = (await cartService.getCart()).filter(i => i.id !== id);
    await cartService._persist(cart);
  },

  async clearCart(): Promise<void> {
    await cartService._persist([]);
  },

  async getTotal(): Promise<number> {
    const cart = await cartService.getCart();
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  // 内部：持久化
  async _persist(items: CartItem[]): Promise<void> {
    cachedItems = items;
    const userId = cachedUserId;
    if (!userId) {
      // 未登录 → localStorage 降级
      try { localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items)); } catch { /* noop */ }
      return;
    }
    try {
      await writeToDb(userId, items);
    } catch (e) {
      console.error('[Cart] Supabase write failed, falling back to localStorage:', e);
      try { localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items)); } catch { /* noop */ }
    }
  },
};
