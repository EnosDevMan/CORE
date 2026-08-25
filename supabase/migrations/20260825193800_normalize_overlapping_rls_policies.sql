-- Replace broad FOR ALL write policies with command-specific policies.
-- This preserves authorization while preventing write policies from also
-- participating in SELECT evaluation.

-- barbers: public read stays separate; owner and self update share one policy.
drop policy if exists barbers_write_admin on public.barbers;
alter policy barbers_update_own on public.barbers
using (
  (select public.auth_role()) = 'owner'
  or user_id = (select auth.uid())
)
with check (
  (select public.auth_role()) = 'owner'
  or user_id = (select auth.uid())
);
create policy barbers_insert_admin on public.barbers
for insert with check ((select public.auth_role()) = 'owner');
create policy barbers_delete_admin on public.barbers
for delete using ((select public.auth_role()) = 'owner');

-- booking_pets
drop policy if exists booking_pets_admin_write on public.booking_pets;
create policy booking_pets_admin_insert on public.booking_pets
for insert with check (
  (select public.auth_role()) = 'owner'
  and public.capability_enabled('pets')
);
create policy booking_pets_admin_update on public.booking_pets
for update using ((select public.auth_role()) = 'owner')
with check (
  (select public.auth_role()) = 'owner'
  and public.capability_enabled('pets')
);
create policy booking_pets_admin_delete on public.booking_pets
for delete using ((select public.auth_role()) = 'owner');

-- booking_services
drop policy if exists booking_services_admin_write on public.booking_services;
create policy booking_services_admin_insert on public.booking_services
for insert with check ((select public.auth_role()) = 'owner');
create policy booking_services_admin_update on public.booking_services
for update using ((select public.auth_role()) = 'owner')
with check ((select public.auth_role()) = 'owner');
create policy booking_services_admin_delete on public.booking_services
for delete using ((select public.auth_role()) = 'owner');

-- booking_settings
drop policy if exists booking_settings_admin_write on public.booking_settings;
create policy booking_settings_admin_insert on public.booking_settings
for insert with check ((select public.auth_role()) = 'owner');
create policy booking_settings_admin_update on public.booking_settings
for update using ((select public.auth_role()) = 'owner')
with check ((select public.auth_role()) = 'owner');
create policy booking_settings_admin_delete on public.booking_settings
for delete using ((select public.auth_role()) = 'owner');

-- business_profile
drop policy if exists business_profile_admin_write on public.business_profile;
create policy business_profile_admin_insert on public.business_profile
for insert with check ((select public.auth_role()) = 'owner');
create policy business_profile_admin_update on public.business_profile
for update using ((select public.auth_role()) = 'owner')
with check ((select public.auth_role()) = 'owner');
create policy business_profile_admin_delete on public.business_profile
for delete using ((select public.auth_role()) = 'owner');

-- feature_settings
drop policy if exists feature_settings_admin_write on public.feature_settings;
create policy feature_settings_admin_insert on public.feature_settings
for insert with check ((select public.auth_role()) = 'owner');
create policy feature_settings_admin_update on public.feature_settings
for update using ((select public.auth_role()) = 'owner')
with check ((select public.auth_role()) = 'owner');
create policy feature_settings_admin_delete on public.feature_settings
for delete using ((select public.auth_role()) = 'owner');

-- gallery_photos
drop policy if exists gallery_photos_write_admin on public.gallery_photos;
create policy gallery_photos_insert_admin on public.gallery_photos
for insert with check ((select public.auth_role()) = 'owner');
create policy gallery_photos_update_admin on public.gallery_photos
for update using ((select public.auth_role()) = 'owner')
with check ((select public.auth_role()) = 'owner');
create policy gallery_photos_delete_admin on public.gallery_photos
for delete using ((select public.auth_role()) = 'owner');

-- services
drop policy if exists services_write_admin on public.services;
create policy services_insert_admin on public.services
for insert with check ((select public.auth_role()) = 'owner');
create policy services_update_admin on public.services
for update using ((select public.auth_role()) = 'owner')
with check ((select public.auth_role()) = 'owner');
create policy services_delete_admin on public.services
for delete using ((select public.auth_role()) = 'owner');

-- schedule_blocks: staff SELECT stays independent from writes.
drop policy if exists blocks_write_admin_or_own_barber on public.schedule_blocks;
create policy blocks_insert_admin_or_own_barber on public.schedule_blocks
for insert to authenticated
with check (
  (select public.auth_role()) = 'owner'
  or barber_id = (
    select profiles.profile_id::text
    from public.profiles
    where profiles.id = (select auth.uid())
  )
);
create policy blocks_update_admin_or_own_barber on public.schedule_blocks
for update to authenticated
using (
  (select public.auth_role()) = 'owner'
  or barber_id = (
    select profiles.profile_id::text
    from public.profiles
    where profiles.id = (select auth.uid())
  )
)
with check (
  (select public.auth_role()) = 'owner'
  or barber_id = (
    select profiles.profile_id::text
    from public.profiles
    where profiles.id = (select auth.uid())
  )
);
create policy blocks_delete_admin_or_own_barber on public.schedule_blocks
for delete to authenticated
using (
  (select public.auth_role()) = 'owner'
  or barber_id = (
    select profiles.profile_id::text
    from public.profiles
    where profiles.id = (select auth.uid())
  )
);
