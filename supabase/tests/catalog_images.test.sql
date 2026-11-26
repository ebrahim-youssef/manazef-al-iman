begin;
set local storage.allow_delete_query = 'true';
select plan(12);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'customer-images@test.local', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now())
on conflict (id) do nothing;

select ok((select public from storage.buckets where id = 'catalog'), 'catalog bucket is public');
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok($$insert into storage.objects(bucket_id, name) values ('catalog', 'anon.webp')$$, '42501', null, 'anon cannot upload catalog images');

set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-4000-8000-000000000002"}', true);
select throws_ok($$insert into storage.objects(bucket_id, name) values ('catalog', 'non-owner.webp')$$, '42501', null, 'non-owner cannot upload catalog images');
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-4000-8000-000000000001"}', true);
select lives_ok($$insert into storage.objects(bucket_id, name) values ('catalog', 'owner-image.webp')$$, 'owner uploads a catalog image');
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select is((select count(*)::integer from storage.objects where bucket_id = 'catalog' and name = 'owner-image.webp'), 0, 'anon cannot list catalog images');
update storage.objects set name = 'anon-changed.webp' where bucket_id = 'catalog' and name = 'owner-image.webp';
delete from storage.objects where bucket_id = 'catalog' and name = 'owner-image.webp';
set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-4000-8000-000000000002"}', true);
select is((select count(*)::integer from storage.objects where bucket_id = 'catalog' and name = 'owner-image.webp'), 0, 'non-owner cannot list catalog images');
update storage.objects set name = 'non-owner-changed.webp' where bucket_id = 'catalog' and name = 'owner-image.webp';
delete from storage.objects where bucket_id = 'catalog' and name = 'owner-image.webp';
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-4000-8000-000000000001"}', true);
select is((select count(*)::integer from storage.objects where bucket_id = 'catalog' and name = 'owner-image.webp'), 1, 'owner can list the image and other roles could not change or delete it');
select is((select count(*)::integer from storage.objects where bucket_id = 'catalog' and name in ('anon-changed.webp', 'non-owner-changed.webp')), 0, 'other roles could not rename the image');
select lives_ok($$update storage.objects set name = 'owner-image-updated.webp' where bucket_id = 'catalog' and name = 'owner-image.webp'$$, 'owner updates a catalog image');
select is((select count(*)::integer from storage.objects where bucket_id = 'catalog' and name = 'owner-image-updated.webp'), 1, 'owner update changes the object');
select lives_ok($$delete from storage.objects where bucket_id = 'catalog' and name = 'owner-image-updated.webp'$$, 'owner deletes a catalog image');
select is((select count(*)::integer from storage.objects where bucket_id = 'catalog' and name = 'owner-image-updated.webp'), 0, 'owner delete removes the object');

select * from finish();
rollback;
