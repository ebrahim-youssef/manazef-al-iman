begin;
select plan(12);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'customer@test.local', '', now(), '{}', '{}', now(), now())
on conflict (id) do nothing;

set local role service_role;
create temporary table checkout_results (result jsonb);
insert into checkout_results select public.create_order('[{"id":"cos-1","quantity":1,"unitPrice":50}]'::jsonb, '10000000-0000-4000-8000-000000000001'::uuid);
insert into checkout_results select public.create_order('[{"id":"cos-1","quantity":1,"unitPrice":60}]'::jsonb, '10000000-0000-4000-8000-000000000001'::uuid);
select is((select count(distinct result ->> 'code')::integer from checkout_results), 1, 'retry returns the same code');
select is((select count(*)::integer from public.orders where checkout_id = '10000000-0000-4000-8000-000000000001'), 1, 'retry inserts one order');
select is((select count(distinct result)::integer from checkout_results), 1, 'retry returns the original totals and lines');
reset role;

delete from public.order_items;
delete from public.orders;
insert into public.orders (code, status, total_egp, item_count, created_at)
select 'BOUND1', 'fulfilled', 10, 1, ((now() at time zone 'Africa/Cairo')::date::timestamp at time zone 'Africa/Cairo')
union all select 'BOUND2', 'fulfilled', 20, 1, (((now() at time zone 'Africa/Cairo')::date - 1)::timestamp at time zone 'Africa/Cairo')
union all select 'BOUND3', 'fulfilled', 40, 1, (((now() at time zone 'Africa/Cairo')::date - 35)::timestamp at time zone 'Africa/Cairo')
union all select 'BOUND4', 'cancelled', 80, 1, now();

set local role anon;
select throws_ok($$select public.reorder_categories(array[]::text[])$$, '42501', null, 'anon cannot reorder');
select throws_ok($$select public.earnings_summary()$$, '42501', null, 'anon cannot view earnings');
set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-4000-8000-000000000002"}', true);
select throws_ok($$select public.reorder_categories(array[]::text[])$$, '42501', null, 'non-owner cannot reorder');
select throws_ok($$select public.earnings_summary()$$, '42501', null, 'non-owner cannot view earnings');
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-4000-8000-000000000001"}', true);
select throws_ok($$select public.reorder_categories(array['missing'])$$, '22023', null, 'wrong category set is rejected');
select lives_ok($$select public.reorder_categories(array(select id from public.categories order by id desc))$$, 'owner can reorder categories');
select is((select array_agg(id order by sort_order, id) from public.categories), (select array_agg(id order by id desc) from public.categories), 'category positions match the requested order');
select is((public.earnings_summary() -> 'today' ->> 'totalEgp')::integer, 10, 'today starts at Cairo midnight and excludes cancelled orders');
select is(public.earnings_summary(), (select jsonb_build_object(
  'today', jsonb_build_object('totalEgp', coalesce(sum(total_egp) filter (where d = today), 0), 'orderCount', count(*) filter (where d = today)),
  'week', jsonb_build_object('totalEgp', coalesce(sum(total_egp) filter (where d between today - ((extract(dow from today)::int + 1) % 7) and today), 0), 'orderCount', count(*) filter (where d between today - ((extract(dow from today)::int + 1) % 7) and today)),
  'month', jsonb_build_object('totalEgp', coalesce(sum(total_egp) filter (where d between date_trunc('month', today::timestamp)::date and today), 0), 'orderCount', count(*) filter (where d between date_trunc('month', today::timestamp)::date and today)))
  from (select total_egp, (created_at at time zone 'Africa/Cairo')::date d, (now() at time zone 'Africa/Cairo')::date today from public.orders where status = 'fulfilled') s), 'earnings use Cairo calendar boundaries');
select * from finish();
rollback;
