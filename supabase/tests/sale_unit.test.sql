begin;
select plan(5);

insert into public.orders (code, total_egp, item_count) values ('OLD234', 10, 1);
insert into public.order_items (order_id, product_id, product_name, unit, unit_price_egp, quantity, line_total_egp)
select id, 'cos-1', 'منتج قديم', 'العبوة', 10, 1, 10 from public.orders where code = 'OLD234';

create temporary table sale_unit_result as
select public.create_order('[{"id":"cos-1","unit":"قديم","unitPrice":77,"quantity":1}]'::jsonb) as result;

select hasnt_column('public', 'products', 'unit', 'products have no sale unit');
select is((select unit from public.order_items where product_name = 'منتج قديم'), 'العبوة', 'old order item keeps its unit');
select is((select unit from public.order_items where order_id = (select id from public.orders where code = (select result ->> 'code' from sale_unit_result))), null, 'new order item has no unit');
select ok(not (select (result -> 'items' -> 0) ? 'unit' from sale_unit_result), 'new order response omits the sale unit');
create temporary table sale_unit_retry as
select public.create_order('[{"id":"cos-1","unitPrice":77,"quantity":1}]'::jsonb, '00000000-0000-4000-8000-000000000016'::uuid) as result;
select is(public.create_order('[]'::jsonb, '00000000-0000-4000-8000-000000000016'::uuid),
  (select result from sale_unit_retry), 'checkout retry returns the same unit-free order');

select * from finish();
rollback;
