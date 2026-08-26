-- Extend the existing branding bucket so the owner can manage both the logo
-- and the public hero cover without introducing another storage provider.
-- Files remain generated WEBP names and mutation stays owner-only.

drop policy if exists "branding_owner_insert" on storage.objects;
create policy "branding_owner_insert" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'branding'
    and public.auth_role() = 'owner'
    and name ~ '^(logos|covers)/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$'
  );

drop policy if exists "branding_owner_update" on storage.objects;
create policy "branding_owner_update" on storage.objects for update to authenticated
  using (bucket_id = 'branding' and public.auth_role() = 'owner')
  with check (
    bucket_id = 'branding'
    and public.auth_role() = 'owner'
    and name ~ '^(logos|covers)/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$'
  );
