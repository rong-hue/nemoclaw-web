-- =====================================================
-- NemoClaw 购物车持久化 — Supabase 建表脚本
-- 在 Supabase SQL Editor 中执行（仅需一次）
-- =====================================================

create table if not exists carts (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table carts enable row level security;

-- 用户只能读写自己的购物车
create policy "select_own" on carts for select
  using (auth.uid()::text = user_id);

create policy "insert_own" on carts for insert
  with check (auth.uid()::text = user_id);

create policy "update_own" on carts for update
  using (auth.uid()::text = user_id);

create policy "delete_own" on carts for delete
  using (auth.uid()::text = user_id);

create index if not exists carts_user_id on carts (user_id);
