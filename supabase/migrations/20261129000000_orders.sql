create table public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  status text not null default 'new' check (status in ('new', 'fulfilled', 'cancelled')),
  total_egp integer not null check (total_egp >= 0),
  item_count integer not null check (item_count > 0),
  created_at timestamptz not null default now(),
  status_changed_at timestamptz not null default now()
);

create unique index orders_code_unique_idx on public.orders (code);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text references public.products(id) on delete set null,
  product_name text not null,
  unit text not null,
  unit_price_egp integer not null check (unit_price_egp >= 0),
  quantity integer not null check (quantity > 0),
  line_total_egp integer not null check (line_total_egp = unit_price_egp * quantity)
);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
revoke all on public.orders, public.order_items from public, anon, authenticated;

create or replace function public.create_order(items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
  order_code text;
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  attempt integer;
  character_index integer;
  inserted_count integer;
  order_total integer;
  order_item_count integer;
  order_lines jsonb;
  item jsonb;
begin
  if items is null or jsonb_typeof(items) <> 'array' then
    raise exception 'Order items must be a non-empty array' using errcode = '22023';
  end if;
  if jsonb_array_length(items) = 0 then
    raise exception 'Order items must be a non-empty array' using errcode = '22023';
  end if;

  for item in select value from jsonb_array_elements(items) loop
    if jsonb_typeof(item) <> 'object'
      or nullif(item ->> 'id', '') is null
      or coalesce(item ->> 'quantity', '') !~ '^[1-9][0-9]*$'
      or coalesce(item ->> 'unitPrice', '') !~ '^(0|[1-9][0-9]*)$' then
      raise exception 'Order item has an invalid id, quantity, or unit price' using errcode = '22023';
    end if;
  end loop;

  perform product.id
  from public.products as product
  join jsonb_array_elements(items) as requested on requested.value ->> 'id' = product.id
  where product.is_available
  order by product.id
  for share of product;

  for attempt in 1..5 loop
    order_code := '';
    for character_index in 1..6 loop
      order_code := order_code || substr(alphabet, floor(random() * length(alphabet))::integer + 1, 1);
    end loop;

    insert into public.orders (code, total_egp, item_count)
    values (order_code, 0, 1)
    on conflict (code) do nothing
    returning id into v_order_id;

    if v_order_id is not null then
      exit;
    end if;
  end loop;

  if v_order_id is null then
    raise exception 'Could not generate a unique order code after five attempts' using errcode = '23505';
  end if;

  insert into public.order_items (order_id, product_id, product_name, unit, unit_price_egp, quantity, line_total_egp)
  select v_order_id,
    product.id,
    product.name,
    product.unit,
    (requested.value ->> 'unitPrice')::integer,
    (requested.value ->> 'quantity')::integer,
    (requested.value ->> 'unitPrice')::integer * (requested.value ->> 'quantity')::integer
  from jsonb_array_elements(items) as requested
  join public.products as product on product.id = requested.value ->> 'id'
  where product.is_available;

  get diagnostics inserted_count = row_count;
  if inserted_count = 0 then
    raise exception 'No available products in order' using errcode = '22023';
  end if;

  select coalesce(sum(line_total_egp), 0)::integer, coalesce(sum(quantity), 0)::integer,
    jsonb_agg(jsonb_build_object(
      'id', product_id,
      'name', product_name,
      'unit', unit,
      'unitPrice', unit_price_egp,
      'quantity', quantity,
      'lineTotal', line_total_egp
    ) order by product_name)
  into order_total, order_item_count, order_lines
  from public.order_items
  where public.order_items.order_id = v_order_id;

  update public.orders
  set total_egp = order_total, item_count = order_item_count
  where public.orders.id = v_order_id;

  return jsonb_build_object('code', order_code, 'items', order_lines, 'total', order_total);
end;
$$;

revoke all on function public.create_order(jsonb) from public, anon, authenticated;
grant execute on function public.create_order(jsonb) to service_role;
