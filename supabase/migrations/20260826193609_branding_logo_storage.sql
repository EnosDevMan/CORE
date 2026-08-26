-- Public brand assets with owner-only mutation and strict generated paths.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'branding',
  'branding',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "branding_public_read" on storage.objects;
create policy "branding_public_read" on storage.objects for select
  using (bucket_id = 'branding');

drop policy if exists "branding_owner_insert" on storage.objects;
create policy "branding_owner_insert" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'branding'
    and public.auth_role() = 'owner'
    and name ~ '^logos/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$'
  );

drop policy if exists "branding_owner_update" on storage.objects;
create policy "branding_owner_update" on storage.objects for update to authenticated
  using (bucket_id = 'branding' and public.auth_role() = 'owner')
  with check (
    bucket_id = 'branding'
    and public.auth_role() = 'owner'
    and name ~ '^logos/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$'
  );

drop policy if exists "branding_owner_delete" on storage.objects;
create policy "branding_owner_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'branding' and public.auth_role() = 'owner');
