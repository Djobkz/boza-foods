-- BOZA FOODS DATABASE
-- Run this whole file in Supabase SQL Editor.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint not null,
  order_type text not null check (order_type in ('sur_place','emporter')),
  items jsonb not null,
  total numeric(10,2) not null,
  status text not null default 'new' check (status in ('new','preparing','ready','cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists orders_status_idx on public.orders(status);

alter table public.orders enable row level security;

-- This is intended for a private small restaurant app.
-- Only authenticated users can read/write orders.
drop policy if exists "authenticated can read orders" on public.orders;
create policy "authenticated can read orders"
on public.orders for select to authenticated using (true);

drop policy if exists "authenticated can insert orders" on public.orders;
create policy "authenticated can insert orders"
on public.orders for insert to authenticated with check (true);

drop policy if exists "authenticated can update orders" on public.orders;
create policy "authenticated can update orders"
on public.orders for update to authenticated using (true) with check (true);

-- One sequence for order numbers.
create sequence if not exists public.boza_order_number_seq start 1;

create or replace function public.next_order_number()
returns bigint
language sql
security definer
set search_path = public
as $$
  select nextval('public.boza_order_number_seq');
$$;

revoke all on function public.next_order_number() from public;
grant execute on function public.next_order_number() to authenticated;

-- Realtime: run this if orders is not already in the realtime publication.
alter publication supabase_realtime add table public.orders;
