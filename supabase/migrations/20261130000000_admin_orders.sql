revoke all on public.orders, public.order_items from public, anon, authenticated;
grant select on public.orders, public.order_items to authenticated;

create policy "owner reads orders" on public.orders
for select to authenticated
using (public.is_owner());

create policy "owner reads order items" on public.order_items
for select to authenticated
using (public.is_owner());

create or replace function public.set_order_status(code text, next_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_order_id uuid;
  current_status text;
begin
  if not public.is_owner() then
    raise exception 'Only the shop owner can change order status' using errcode = '42501';
  end if;

  if next_status not in ('new', 'fulfilled', 'cancelled') then
    raise exception 'Order status must be new, fulfilled, or cancelled' using errcode = '22023';
  end if;

  select id, status
  into target_order_id, current_status
  from public.orders
  where public.orders.code = set_order_status.code
  for update;

  if target_order_id is null then
    raise exception 'Order code does not exist' using errcode = 'P0002';
  end if;

  if current_status is distinct from next_status then
    update public.orders
    set status = next_status,
        status_changed_at = pg_catalog.clock_timestamp()
    where id = target_order_id;
  end if;
end;
$$;

revoke all on function public.set_order_status(text, text) from public, anon, authenticated;
grant execute on function public.set_order_status(text, text) to authenticated;
