insert into storage.buckets (id, name, public)
values ('catalog', 'catalog', true)
on conflict (id) do update set public = true;

create policy "owner reads catalog images" on storage.objects
for select to authenticated
using (bucket_id = 'catalog' and public.is_owner());

create policy "owner inserts catalog images" on storage.objects
for insert to authenticated
with check (bucket_id = 'catalog' and public.is_owner());

create policy "owner updates catalog images" on storage.objects
for update to authenticated
using (bucket_id = 'catalog' and public.is_owner())
with check (bucket_id = 'catalog' and public.is_owner());

create policy "owner deletes catalog images" on storage.objects
for delete to authenticated
using (bucket_id = 'catalog' and public.is_owner());
