begin;
select plan(26);
create temporary table order_creation_test (result jsonb, orders_before_failure integer);
grant insert, select, update on order_creation_test to service_role;

select has_table('public', 'orders', 'orders table exists');
select has_table('public', 'order_items', 'order_items table exists');
select has_index('public', 'orders', 'orders_code_unique_idx', 'order codes have a unique index');
select has_function('public', 'create_order', array['jsonb'], 'create_order accepts JSON items');
select ok(not has_function_privilege('anon', 'public.create_order(jsonb)', 'EXECUTE'), 'anon cannot execute create_order');
select ok(not has_function_privilege('authenticated', 'public.create_order(jsonb)', 'EXECUTE'), 'authenticated cannot execute create_order');
select ok(not has_table_privilege('anon', 'public.orders', 'SELECT'), 'anon cannot read orders');
select ok(not has_table_privilege('anon', 'public.order_items', 'SELECT'), 'anon cannot read order_items');
select ok(not has_table_privilege('authenticated', 'public.orders', 'SELECT'), 'authenticated cannot read orders');
select ok(not has_table_privilege('authenticated', 'public.order_items', 'SELECT'), 'authenticated cannot read order_items');

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok($$select public.create_order('[]'::jsonb)$$, '42501', null, 'anon cannot call create_order');
select throws_ok($$select * from public.orders$$, '42501', null, 'anon order reads are denied');
select throws_ok($$select * from public.order_items$$, '42501', null, 'anon order item reads are denied');

set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated"}', true);
select throws_ok($$select public.create_order('[]'::jsonb)$$, '42501', null, 'authenticated cannot call create_order');
select throws_ok($$select * from public.orders$$, '42501', null, 'authenticated order reads are denied');
select throws_ok($$select * from public.order_items$$, '42501', null, 'authenticated order item reads are denied');

set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
insert into order_creation_test values (public.create_order('[{"id":"cos-1","name":"معدل من العميل","unit":"وحدة غير صحيحة","unitPrice":77,"quantity":2}]'::jsonb));
update order_creation_test set orders_before_failure = (select count(*)::integer from public.orders);
select ok((select result ->> 'code' ~ '^[A-HJKMNP-Z2-9]{6}$' from order_creation_test), 'code uses six allowed characters');
select is((select jsonb_array_length(result -> 'items') from order_creation_test), 1, 'RPC returns the saved item');
select is((select result #>> '{items,0,name}' from order_creation_test), (select name from public.products where id = 'cos-1'), 'order item uses the database product name');
select is((select result #>> '{items,0,unit}' from order_creation_test), (select unit from public.products where id = 'cos-1'), 'order item uses the database unit');
select is((select result #>> '{items,0,unitPrice}' from order_creation_test), '77', 'order item snapshots the calculated unit price');
select is((select result ->> 'total' from order_creation_test), '154', 'order returns the snapshotted total');
select is((select count(*)::integer from order_creation_test join public.orders on public.orders.code = order_creation_test.result ->> 'code' where public.orders.total_egp = 154 and public.orders.item_count = 2), 1, 'order row stores its total and item count');
select is((select count(*)::integer from order_creation_test join public.orders on public.orders.code = order_creation_test.result ->> 'code' join public.order_items on public.order_items.order_id = public.orders.id where public.order_items.product_name = (select name from public.products where id = 'cos-1') and public.order_items.unit = (select unit from public.products where id = 'cos-1') and public.order_items.unit_price_egp = 77 and public.order_items.quantity = 2 and public.order_items.line_total_egp = 154), 1, 'one function call atomically stores the item snapshots');
select throws_ok($$select public.create_order('[{"id":"cos-1","unitPrice":2147483648,"quantity":1}]'::jsonb)$$, '22003', null, 'an item insert failure aborts order creation');
select is((select count(*)::integer - min(orders_before_failure) from public.orders cross join order_creation_test), 0, 'a failed item insert leaves no partial order row');

select * from finish();
rollback;
