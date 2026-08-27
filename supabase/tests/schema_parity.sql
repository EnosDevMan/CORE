-- Fresh installations execute only schema.sql. Guard the production features
-- that previously existed only in incremental migrations.
begin;

do $$
declare
  v_working_hours_definer boolean;
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'business_profile'
      and column_name = 'surface_mode'
  ) or not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'business_profile'
      and column_name = 'custom_primary_color'
  ) or not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'business_profile'
      and column_name = 'custom_secondary_color'
  ) or not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'business_profile'
      and column_name = 'custom_accent_color'
  ) then
    raise exception 'TEST FAILURE: consolidated schema is missing current appearance columns';
  end if;

  if not public.appearance_is_available('barbershop', 'modern', 'custom') then
    raise exception 'TEST FAILURE: consolidated schema does not support custom palettes';
  end if;

  if to_regprocedure(
    'public.complete_business_onboarding(text,public.business_niche,text,text,text,text,text,text,text,text,text,text[],jsonb,jsonb,jsonb,integer,integer,text)'
  ) is null then
    raise exception 'TEST FAILURE: consolidated schema is missing current onboarding overload';
  end if;

  select p.prosecdef into v_working_hours_definer
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'validate_working_hours_payload'
    and pg_get_function_identity_arguments(p.oid) = '';

  if v_working_hours_definer is distinct from true then
    raise exception 'TEST FAILURE: working-hours trigger is not SECURITY DEFINER in fresh schema';
  end if;

  if has_function_privilege('authenticated', 'public.working_hours_are_valid(jsonb)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.validate_working_hours_payload()', 'EXECUTE')
     or has_function_privilege('anon', 'public.working_hours_are_valid(jsonb)', 'EXECUTE')
     or has_function_privilege('anon', 'public.validate_working_hours_payload()', 'EXECUTE') then
    raise exception 'TEST FAILURE: private working-hours helpers are browser executable';
  end if;

  if not has_table_privilege('authenticated', 'public.schedule_blocks', 'UPDATE') then
    raise exception 'TEST FAILURE: fresh schema is missing schedule_blocks UPDATE grant';
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.barbershop_config'::regclass
      and tgname = 'config_sync_business_profile'
      and not tgisinternal
  ) or not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.business_profile'::regclass
      and tgname = 'business_profile_sync_legacy_config_logo'
      and not tgisinternal
  ) then
    raise exception 'TEST FAILURE: fresh schema is missing admin/public identity synchronization';
  end if;
end;
$$;

rollback;
