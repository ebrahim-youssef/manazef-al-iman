begin;

create function public.normalize_brand_name(value text) returns text
language sql immutable strict parallel safe set search_path = '' as $$
  select trim(regexp_replace(lower(translate(regexp_replace(value, '[ؐ-ًؚ-ٰٟۖ-ۭـ]', '', 'g'), 'أإآٱةى', 'ااااهي')), '[[:space:]]+', ' ', 'g'));
$$;

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  arabic_name text,
  normalized_name text generated always as (public.normalize_brand_name(name)) stored not null unique
);

insert into public.brands (name)
select distinct on (public.normalize_brand_name(brand)) brand
from public.products
order by public.normalize_brand_name(brand), brand;

insert into public.brands (name, arabic_name) values
  ('Pril', 'بريل'), ('Ariel', 'أريال'), ('Persil', 'برسيل'), ('Clorox', 'كلوركس'),
  ('Dettol', 'ديتول'), ('Fairy', 'فيري'), ('Downy', 'داوني'), ('Harpic', 'هاربيك'),
  ('Fine', 'فاين'), ('Dove', 'دوف'), ('Lux', 'لوكس'), ('Lifebuoy', 'لايفبوي'),
  ('Sanita', 'سانيتا'), ('Comfort', 'كومفورت'), ('Tide', 'تايد'), ('Omo', 'أومو'),
  ('Zeina', 'زينة'), ('Flash', 'فلاش'), ('Air Wick', 'إير ويك')
on conflict (normalized_name) do update set arabic_name = excluded.arabic_name;

alter table public.products add column brand_id uuid references public.brands(id) on delete restrict;
update public.products p set brand_id = b.id from public.brands b
where b.normalized_name = public.normalize_brand_name(p.brand);
alter table public.products alter column brand_id set not null;
create index products_brand_id_idx on public.products (brand_id);
alter table public.products drop column brand;

alter table public.brands enable row level security;
revoke all on public.brands from public, anon, authenticated;
grant select on public.brands to anon, authenticated;
grant insert, update, delete on public.brands to authenticated;
create policy "public reads brands" on public.brands for select to anon, authenticated using (true);
create policy "owner inserts brands" on public.brands for insert to authenticated with check (public.is_owner());
create policy "owner updates brands" on public.brands for update to authenticated using (public.is_owner()) with check (public.is_owner());
create policy "owner deletes brands" on public.brands for delete to authenticated using (public.is_owner());

commit;
