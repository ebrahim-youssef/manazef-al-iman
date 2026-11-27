begin;
select plan(32);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'customer@test.local', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now())
on conflict (id) do nothing;

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok($$select user_id from private.shop_owner$$, '42501', null, 'anon cannot select the shop owner id');
select is((select count(*)::integer from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname <> 'is_owner' and p.prosrc ilike '%shop_owner%' and has_function_privilege('anon', p.oid, 'EXECUTE')), 0, 'anon cannot execute a function that reveals the shop owner id');
select ok((select count(*) from public.categories) > 0, 'anon reads categories');
select ok((select count(*) from public.products) > 0, 'anon reads products');
select is((select count(*)::integer from public.settings), 1, 'anon reads settings');
select throws_ok($$insert into public.categories(id, slug, name, image_path) values ('blocked', 'blocked', 'blocked', '')$$, '42501', null, 'anon cannot insert categories');
select throws_ok($$update public.categories set name = 'blocked'$$, '42501', null, 'anon cannot update categories');
select throws_ok($$delete from public.categories$$, '42501', null, 'anon cannot delete categories');
select throws_ok($$insert into public.products(id, category_id, name, brand, image_path, price_egp) values ('blocked', 'cleaners', 'x', 'x', '', 1)$$, '42501', null, 'anon cannot insert products');
select throws_ok($$update public.products set name = 'blocked'$$, '42501', null, 'anon cannot update products');
select throws_ok($$delete from public.products$$, '42501', null, 'anon cannot delete products');
select throws_ok($$insert into public.settings(id, shop_name, whatsapp_number, phone_number, address, opening_hours_text, facebook_url, instagram_url) values (false, 'x', 'x', 'x', 'x', 'x', 'x', 'x')$$, '42501', null, 'anon cannot insert settings');
select throws_ok($$update public.settings set shop_name = 'blocked'$$, '42501', null, 'anon cannot update settings');
select throws_ok($$delete from public.settings$$, '42501', null, 'anon cannot delete settings');

set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-4000-8000-000000000002"}', true);
select throws_ok($$insert into public.categories(id, slug, name, image_path) values ('blocked', 'blocked', 'blocked', '')$$, '42501', null, 'non-owner cannot insert categories');
select throws_ok($$insert into public.products(id, category_id, name, brand, image_path, price_egp) values ('blocked', 'cleaners', 'x', 'x', '', 1)$$, '42501', null, 'non-owner cannot insert products');
select throws_ok($$insert into public.settings(id, shop_name, whatsapp_number, phone_number, address, opening_hours_text, facebook_url, instagram_url) values (false, 'x', 'x', 'x', 'x', 'x', 'x', 'x')$$, '42501', null, 'non-owner cannot insert settings');
update public.categories set name = 'blocked';
select is((select count(*)::integer from public.categories where name = 'blocked'), 0, 'non-owner cannot update categories');
update public.products set name = 'blocked';
select is((select count(*)::integer from public.products where name = 'blocked'), 0, 'non-owner cannot update products');
update public.settings set shop_name = 'blocked';
select is((select count(*)::integer from public.settings where shop_name = 'blocked'), 0, 'non-owner cannot update settings');
delete from public.categories;
select ok(exists(select 1 from public.categories where id = 'cleaners'), 'non-owner cannot delete categories');
delete from public.products;
select ok(exists(select 1 from public.products where id = 'cos-1'), 'non-owner cannot delete products');
delete from public.settings;
select ok(exists(select 1 from public.settings where id), 'non-owner cannot delete settings');

select set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-4000-8000-000000000001"}', true);
select lives_ok($$insert into public.categories(id, slug, name, image_path) values ('owner-test', 'owner-test', 'test', '')$$, 'owner inserts category');
select lives_ok($$update public.categories set name = 'updated' where id = 'owner-test'$$, 'owner updates category');
select lives_ok($$delete from public.categories where id = 'owner-test'$$, 'owner deletes category');
select lives_ok($$update public.products set name = name where id = 'cos-1'$$, 'owner updates products');
select lives_ok($$update public.settings set shop_name = 'updated' where id$$, 'owner updates settings');
select throws_ok($$update public.products set sale_type = 'price', sale_value = price_egp where id = 'cos-1'$$, '23514', 'new row for relation "products" violates check constraint "products_sale_price_below_original"', 'sale price must be below the original price');
select throws_ok($$update public.products set sale_type = 'percent', sale_value = 0 where id = 'cos-1'$$, '23514', 'new row for relation "products" violates check constraint "products_sale_percent_range"', 'sale percent must be at least one');
select throws_ok($$update public.products set sale_type = 'percent', sale_value = 91 where id = 'cos-1'$$, '23514', 'new row for relation "products" violates check constraint "products_sale_percent_range"', 'sale percent cannot exceed ninety');
select throws_ok($$update public.products set sale_type = 'price', sale_value = 50, sale_starts_at = now(), sale_ends_at = now() where id = 'cos-1'$$, '23514', 'new row for relation "products" violates check constraint "products_sale_dates_order"', 'sale start must be before its end');
select * from finish();
rollback;
