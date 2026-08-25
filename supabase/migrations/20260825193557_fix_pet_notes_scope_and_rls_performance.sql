-- Fix correlated pet-note authorization and reduce repeated auth evaluation in RLS.
-- The previous policy used an unqualified `pet_id` inside a subquery whose
-- `booking_pets` relation also has a `pet_id` column. PostgreSQL resolved it to
-- `bp.pet_id`, turning the comparison into `bp.pet_id = bp.pet_id`.

create index if not exists pet_notes_author_id_idx on public.pet_notes(author_id);

alter policy profiles_select_own_or_admin on public.profiles
using (((select auth.uid()) = id) or ((select public.auth_role()) = 'owner'));

alter policy bookings_select_own_barber_or_admin on public.bookings
using (
  ((select auth.uid()) = customer_id)
  or ((select public.auth_role()) = 'owner')
  or (
    (select public.auth_role()) = 'professional'
    and barber_id = (
      select profiles.profile_id
      from public.profiles
      where profiles.id = (select auth.uid())
    )
  )
);

alter policy barbers_update_own on public.barbers
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

alter policy blocks_write_admin_or_own_barber on public.schedule_blocks
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

alter policy pets_owner_or_admin_insert on public.pets
with check (
  public.capability_enabled('pets')
  and (owner_id = (select auth.uid()) or (select public.auth_role()) = 'owner')
);

alter policy pets_owner_or_admin_read on public.pets
using (owner_id = (select auth.uid()) or (select public.auth_role()) = 'owner');

alter policy pets_owner_or_admin_update on public.pets
using (owner_id = (select auth.uid()) or (select public.auth_role()) = 'owner')
with check (
  public.capability_enabled('pets')
  and (owner_id = (select auth.uid()) or (select public.auth_role()) = 'owner')
);

alter policy pet_notes_related_read on public.pet_notes
using (
  (select public.auth_role()) = 'owner'
  or exists (
    select 1
    from public.pets p
    where p.id = pet_notes.pet_id
      and p.owner_id = (select auth.uid())
  )
  or (
    (select public.auth_role()) = 'professional'
    and exists (
      select 1
      from public.booking_pets bp
      join public.bookings b on b.id = bp.booking_id
      where bp.pet_id = pet_notes.pet_id
        and b.barber_id = (
          select profiles.profile_id
          from public.profiles
          where profiles.id = (select auth.uid())
        )
    )
  )
);

alter policy pet_notes_staff_write on public.pet_notes
with check (
  public.capability_enabled('pets')
  and author_id = (select auth.uid())
  and (select public.auth_role()) in ('owner', 'professional')
);
