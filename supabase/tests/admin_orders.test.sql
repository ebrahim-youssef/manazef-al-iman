begin;
select plan(18);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'customer@test.local', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now())
on conflict (id) do nothing;

set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
insert into public.orders (code, status, total_egp, item_count)
values ('AB23CD', 'new', 250, 2);
insert into public.order_items (order_id, product_id, product_name, unit, unit_price_egp, quantity, line_total_egp)
select id, 'cos-1', 'اسم محفوظ', 'العبوة', 125, 2, 250 from public.orders where code = 'AB23CD';
create temporary table admin_order_status_snapshot (status_changed_at timestamptz);
grant select, insert on admin_order_status_snapshot to authenticated;
reset role;

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok($$select * from public.orders$$, '42501', null, 'anon cannot read orders');
select throws_ok($$select * from public.order_items$$, '42501', null, 'anon cannot read order items');
select throws_ok($$select public.set_order_status('AB23CD', 'fulfilled')$$, '42501', null, 'anon cannot change order status');

set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-4000-8000-000000000002"}', true);
select is((select count(*)::integer from public.orders), 0, 'non-owner reads no orders');
select is((select count(*)::integer from public.order_items), 0, 'non-owner reads no order items');
select throws_ok($$select public.set_order_status('AB23CD', 'fulfilled')$$, '42501', null, 'non-owner cannot change order status');
select throws_ok($$update public.orders set total_egp = total_egp$$, '42501', null, 'authenticated users cannot directly update orders');

set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-4000-8000-000000000001"}', true);
select is((select count(*)::integer from public.orders where code = 'AB23CD'), 1, 'owner reads order');
select is((select count(*)::integer from public.order_items where product_name = 'اسم محفوظ'), 1, 'owner reads snapshotted order items');
select lives_ok($$select public.set_order_status('AB23CD', 'fulfilled')$$, 'owner sets an order status');
select is((select status from public.orders where code = 'AB23CD'), 'fulfilled', 'status update is applied');
select is((select total_egp from public.orders where code = 'AB23CD'), 250, 'status update preserves the order total');
select is((select item_count from public.orders where code = 'AB23CD'), 2, 'status update preserves the item count');
select ok((select status_changed_at > created_at from public.orders where code = 'AB23CD'), 'status update records its change time');
insert into admin_order_status_snapshot select status_changed_at from public.orders where code = 'AB23CD';
select lives_ok($$select public.set_order_status('AB23CD', 'fulfilled')$$, 'setting the current status again is idempotent');
select is((select status from public.orders where code = 'AB23CD'), 'fulfilled', 'idempotent status remains fulfilled');
select is((select status_changed_at from public.orders where code = 'AB23CD'), (select status_changed_at from admin_order_status_snapshot), 'idempotent status leaves the change time untouched');
select throws_ok($$select public.set_order_status('AB23CD', 'invalid')$$, '22023', null, 'invalid order status is rejected');
select * from finish();
rollback;
