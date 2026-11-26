create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.shop_owner (
  singleton boolean primary key default true check (singleton),
  user_id uuid not null unique references auth.users(id) on delete cascade
);
revoke all on private.shop_owner from public, anon, authenticated;
alter table private.shop_owner enable row level security;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from private.shop_owner
    where user_id = (select auth.uid())
  );
$$;
revoke all on function public.is_owner() from public;
grant execute on function public.is_owner() to anon, authenticated;

create table public.settings (
  id boolean primary key default true check (id),
  shop_name text not null,
  whatsapp_number text not null,
  phone_number text not null,
  address text not null,
  map_lat double precision,
  map_lng double precision,
  opening_hours_text text not null,
  facebook_url text not null,
  instagram_url text not null,
  delivery_areas text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table public.categories (
  id text primary key,
  slug text not null unique,
  name text not null,
  image_path text not null,
  sort_order integer not null default 0
);

create table public.products (
  id text primary key,
  category_id text not null references public.categories(id) on update cascade on delete restrict,
  name text not null,
  brand text not null,
  unit text not null,
  description text not null default '',
  image_path text not null,
  price_egp integer not null check (price_egp >= 0),
  is_available boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
revoke insert, update, delete, truncate, references, trigger on public.settings, public.categories, public.products from anon, public;
grant select on public.settings, public.categories, public.products to anon, authenticated;
grant insert, update, delete on public.settings, public.categories, public.products to authenticated;

create policy "public reads settings" on public.settings for select to anon, authenticated using (true);
create policy "owner inserts settings" on public.settings for insert to authenticated with check (public.is_owner());
create policy "owner updates settings" on public.settings for update to authenticated using (public.is_owner()) with check (public.is_owner());
create policy "owner deletes settings" on public.settings for delete to authenticated using (public.is_owner());

create policy "public reads categories" on public.categories for select to anon, authenticated using (true);
create policy "owner inserts categories" on public.categories for insert to authenticated with check (public.is_owner());
create policy "owner updates categories" on public.categories for update to authenticated using (public.is_owner()) with check (public.is_owner());
create policy "owner deletes categories" on public.categories for delete to authenticated using (public.is_owner());

create policy "public reads products" on public.products for select to anon, authenticated using (true);
create policy "owner inserts products" on public.products for insert to authenticated with check (public.is_owner());
create policy "owner updates products" on public.products for update to authenticated using (public.is_owner()) with check (public.is_owner());
create policy "owner deletes products" on public.products for delete to authenticated using (public.is_owner());
