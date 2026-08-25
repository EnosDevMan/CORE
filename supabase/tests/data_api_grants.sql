-- Reproduce the least-privilege Data API surface of a new Supabase project.
begin;

do $$
declare
  v_public_table text;
  v_private_table text;
begin
  foreach v_public_table in array array[
    'barbershop_config', 'services', 'gallery_photos',
    'business_profile', 'feature_settings', 'booking_settings'
  ] loop
    if not has_table_privilege('anon', 'public.' || v_public_table, 'SELECT')
       or not has_table_privilege('authenticated', 'public.' || v_public_table, 'SELECT') then
      raise exception 'TEST FAILURE: public runtime table % is unreachable', v_public_table;
    end if;

    if has_table_privilege('anon', 'public.' || v_public_table, 'INSERT')
       or has_table_privilege('anon', 'public.' || v_public_table, 'UPDATE')
       or has_table_privilege('anon', 'public.' || v_public_table, 'DELETE') then
      raise exception 'TEST FAILURE: anonymous visitor can modify %', v_public_table;
    end if;
  end loop;

  foreach v_private_table in array array[
    'profiles', 'bookings', 'schedule_blocks', 'booking_services',
    'installation_owners', 'installation_bootstrap',
    'pets', 'pet_notes', 'booking_pets'
  ] loop
    if has_table_privilege('anon', 'public.' || v_private_table, 'SELECT')
       or has_table_privilege('anon', 'public.' || v_private_table, 'INSERT')
       or has_table_privilege('anon', 'public.' || v_private_table, 'UPDATE')
       or has_table_privilege('anon', 'public.' || v_private_table, 'DELETE') then
      raise exception 'TEST FAILURE: anonymous visitor can reach %', v_private_table;
    end if;
  end loop;

  if has_table_privilege('authenticated', 'public.installation_owners', 'SELECT')
     or has_table_privilege('authenticated', 'public.installation_bootstrap', 'SELECT')
     or has_table_privilege('authenticated', 'public.profiles', 'DELETE')
     or has_table_privilege('authenticated', 'public.bookings', 'INSERT')
     or has_table_privilege('authenticated', 'public.bookings', 'DELETE')
     or has_table_privilege('authenticated', 'public.barbers', 'SELECT')
     or has_column_privilege('authenticated', 'public.barbers', 'user_id', 'SELECT')
     or not has_column_privilege('authenticated', 'public.barbers', 'id', 'SELECT')
     or not has_table_privilege('authenticated', 'public.booking_services', 'SELECT') then
    raise exception 'TEST FAILURE: authenticated grants exceed or omit the documented surface';
  end if;
end;
$$;

set local role anon;
select id from public.barbershop_config where id = true;
select id from public.business_profile where id = true;
select capability from public.feature_settings;
select id from public.booking_settings where id = true;
select id from public.services;
select id from public.gallery_photos;
select id from public.get_public_professionals();
select id from public.get_public_schedule_blocks();

reset role;
set local role authenticated;
select id from public.profiles;
select id from public.bookings;
select id from public.schedule_blocks;
select id from public.barbers;
select booking_id from public.booking_services;

rollback;
