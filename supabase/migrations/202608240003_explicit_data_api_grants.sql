-- Explicit, least-privilege Data API exposure for current Supabase defaults.
-- Existing installations should apply this migration only once after the
-- preceding universal-business migrations; new projects use schema.sql only.
begin;

revoke all on table
  public.profiles,
  public.barbershop_config,
  public.barbers,
  public.services,
  public.bookings,
  public.schedule_blocks,
  public.gallery_photos,
  public.business_profile,
  public.feature_settings,
  public.booking_settings,
  public.booking_services,
  public.installation_owners,
  public.installation_bootstrap,
  public.pets,
  public.pet_notes,
  public.booking_pets
from anon, authenticated;

grant select on table
  public.barbershop_config,
  public.services,
  public.gallery_photos,
  public.business_profile,
  public.feature_settings,
  public.booking_settings
to anon;

grant select, update on table
  public.profiles,
  public.barbershop_config,
  public.bookings,
  public.business_profile,
  public.feature_settings,
  public.booking_settings
to authenticated;

grant select, insert, update on table public.services to authenticated;
grant insert, update on table public.barbers to authenticated;
grant select (id) on table public.barbers to authenticated;
grant select, insert, delete on table public.schedule_blocks to authenticated;
grant select, insert, update, delete on table public.gallery_photos to authenticated;
grant select on table public.booking_services to authenticated;
grant select, insert, update, delete on table
  public.pets, public.pet_notes, public.booking_pets
to authenticated;

commit;
