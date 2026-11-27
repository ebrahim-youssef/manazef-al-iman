alter table public.products drop column unit;
alter table public.order_items alter column unit drop not null;

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

  insert into public.order_items (order_id, product_id, product_name, unit_price_egp, quantity, line_total_egp)
  select v_order_id,
    product.id,
    product.name,
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


create or replace function public.create_order(items jsonb, checkout_id uuid)
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
      (select jsonb_agg(jsonb_build_object('id', i.product_id, 'name', i.product_name,
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
