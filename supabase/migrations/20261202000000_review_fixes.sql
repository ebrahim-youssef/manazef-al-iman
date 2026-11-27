alter table public.orders add column checkout_id uuid unique;

create function public.create_order(items jsonb, checkout_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_id uuid;
  result jsonb;
begin
  if checkout_id is null then
    raise exception 'Checkout id is required' using errcode = '22023';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(checkout_id::text, 0));
  select id into existing_id from public.orders where orders.checkout_id = create_order.checkout_id;
  if existing_id is not null then
    select jsonb_build_object('code', o.code, 'total', o.total_egp, 'items',
      (select jsonb_agg(jsonb_build_object('id', i.product_id, 'name', i.product_name, 'unit', i.unit,
        'unitPrice', i.unit_price_egp, 'quantity', i.quantity, 'lineTotal', i.line_total_egp) order by i.product_name)
       from public.order_items i where i.order_id = o.id))
    into result from public.orders o where o.id = existing_id;
    return result;
  end if;
  result := public.create_order(items);
  update public.orders set checkout_id = create_order.checkout_id where code = result ->> 'code';
  return result;
end;
$$;
revoke all on function public.create_order(jsonb, uuid) from public, anon, authenticated;
grant execute on function public.create_order(jsonb, uuid) to service_role;

create function public.reorder_categories(category_ids text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_owner() then
    raise exception 'Only the shop owner can reorder categories' using errcode = '42501';
  end if;
  lock table public.categories in share row exclusive mode;
  if category_ids is null or cardinality(category_ids) <> (select count(*) from public.categories)
    or (select count(distinct id) from unnest(category_ids) as ids(id)) <> cardinality(category_ids)
    or exists (select 1 from unnest(category_ids) as ids(id) where not exists (select 1 from public.categories c where c.id = ids.id)) then
    raise exception 'Category ids must match existing categories' using errcode = '22023';
  end if;
  update public.categories c set sort_order = (ids.position - 1)::integer
  from unnest(category_ids) with ordinality as ids(id, position) where c.id = ids.id;
end;
$$;
revoke all on function public.reorder_categories(text[]) from public, anon, authenticated;
grant execute on function public.reorder_categories(text[]) to authenticated;

create function public.earnings_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  today date := (now() at time zone 'Africa/Cairo')::date;
  week_start date := today - ((extract(dow from today)::integer + 1) % 7);
  month_start date := date_trunc('month', today::timestamp)::date;
  result jsonb;
begin
  if not public.is_owner() then
    raise exception 'Only the shop owner can view earnings' using errcode = '42501';
  end if;
  select jsonb_build_object(
    'today', jsonb_build_object('totalEgp', coalesce(sum(total_egp) filter (where local_date = today), 0), 'orderCount', count(*) filter (where local_date = today)),
    'week', jsonb_build_object('totalEgp', coalesce(sum(total_egp) filter (where local_date between week_start and today), 0), 'orderCount', count(*) filter (where local_date between week_start and today)),
    'month', jsonb_build_object('totalEgp', coalesce(sum(total_egp) filter (where local_date between month_start and today), 0), 'orderCount', count(*) filter (where local_date between month_start and today)))
  into result from (select total_egp, (created_at at time zone 'Africa/Cairo')::date as local_date from public.orders where status = 'fulfilled') orders;
  return result;
end;
$$;
revoke all on function public.earnings_summary() from public, anon, authenticated;
grant execute on function public.earnings_summary() to authenticated;
