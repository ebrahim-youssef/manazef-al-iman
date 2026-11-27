begin;
select plan(15);

select ok(not exists (select 1 from public.products where brand_id is null), 'every product has a brand');
set local role anon;
select ok((select count(*) from public.brands) > 0, 'anon can read brands');
select throws_ok($$insert into public.brands(name) values ('blocked')$$, '42501', null, 'anon cannot insert brands');
select throws_ok($$update public.brands set name = 'blocked'$$, '42501', null, 'anon cannot update brands');
select throws_ok($$delete from public.brands$$, '42501', null, 'anon cannot delete brands');

set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-4000-8000-000000000002"}', true);
select throws_ok($$insert into public.brands(name) values ('blocked')$$, '42501', null, 'non-owner cannot insert brands');
update public.brands set name = 'blocked';
select is((select count(*)::integer from public.brands where name = 'blocked'), 0, 'non-owner cannot update brands');
delete from public.brands;
select ok((select count(*) from public.brands) > 0, 'non-owner cannot delete brands');
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-4000-8000-000000000001"}', true);
select lives_ok($$insert into public.brands(name) values ('بريل')$$, 'owner can insert a brand');
select throws_ok($$insert into public.brands(name) values ('بريل ')$$, '23505', null, 'trailing spaces cannot create a duplicate');
select lives_ok($$insert into public.brands(name) values ('أختبار')$$, 'owner can insert an alef variant');
select throws_ok($$insert into public.brands(name) values ('اختبار')$$, '23505', null, 'alef variants cannot create duplicates');
select lives_ok($$update public.brands set name = 'تجربة' where name = 'أختبار'$$, 'owner can update a brand');
select lives_ok($$delete from public.brands where name = 'تجربة'$$, 'owner can delete an unused brand');
select throws_ok($$delete from public.brands where id = (select brand_id from public.products limit 1)$$, '23503', null, 'a used brand cannot be deleted');
select * from finish();
rollback;
