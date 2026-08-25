create or replace function public.complete_business_onboarding(
  p_business_name text,
  p_niche_id public.business_niche,
  p_theme_id text,
  p_phone text,
  p_address text,
  p_capabilities text[],
  p_business_hours jsonb,
  p_services jsonb,
  p_professionals jsonb,
  p_interval_minutes integer,
  p_booking_window_days integer,
  p_setup_code text default null
) returns public.business_profile
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile public.business_profile;
  v_capability text;
  v_service record;
  v_professional record;
begin
  -- On a fresh installation, claim the first owner inside this transaction.
  -- If any later validation/insert fails, PostgreSQL also rolls back code
  -- consumption and owner promotion, so retrying cannot strand the wizard.
  if public.auth_role() is distinct from 'owner' then
    perform public.claim_first_owner(p_setup_code);
  end if;
  if p_business_name is null or length(trim(p_business_name)) not between 2 and 100 then
    raise exception using errcode = '23514', message = 'Informe um nome de negócio válido.';
  end if;
  if p_theme_id !~ '^[a-z][a-z0-9_]*$' then
    raise exception using errcode = '23514', message = 'Tema inválido.';
  end if;
  if p_phone is not null and btrim(p_phone) <> '' and (
       length(trim(p_phone)) > 32
       or p_phone !~ '^\+?[0-9().[:space:]-]+$'
       or (
         regexp_replace(p_phone, '[^0-9]', '', 'g') !~ '^[0-9]{10,11}$'
         and regexp_replace(p_phone, '[^0-9]', '', 'g') !~ '^55[0-9]{10,11}$'
       )
     ) then
    raise exception using errcode = '23514', message = 'Informe um telefone brasileiro válido com DDD.';
  end if;
  if p_address is not null and length(trim(p_address)) > 500 then
    raise exception using errcode = '23514', message = 'Endereço excede o limite de 500 caracteres.';
  end if;
  if not public.working_hours_are_valid(p_business_hours)
     or jsonb_array_length(p_business_hours->'daysOpen') = 0 then
    raise exception using errcode = '23514', message = 'Horário de funcionamento inválido.';
  end if;
  if p_interval_minutes < 5 or p_interval_minutes > 480
     or p_booking_window_days < 1 or p_booking_window_days > 365 then
    raise exception using errcode = '23514', message = 'Configuração da agenda inválida.';
  end if;
  if p_capabilities is null or cardinality(p_capabilities) > 50
     or exists (
       select 1 from unnest(p_capabilities) item
       where item not in (
         'online_booking', 'customers', 'professionals', 'services', 'financial',
         'reports', 'pets', 'inventory', 'whatsapp', 'ai', 'advanced_themes',
         'custom_domain', 'loyalty'
       )
     ) then
    raise exception using errcode = '23514', message = 'Capability inválida.';
  end if;
  if jsonb_typeof(p_services) <> 'array' or jsonb_array_length(p_services) > 100
     or exists (
       select 1 from jsonb_to_recordset(p_services) as item(name text, duration integer, price numeric, category text)
       where item.name is null
          or length(trim(item.name)) not between 2 and 100
          or item.duration is null or item.duration not between 5 and 480
          or item.price is null or item.price < 0 or item.price > 99999999.99
          or length(coalesce(item.category, '')) > 100
     ) then
    raise exception using errcode = '23514', message = 'Lista de serviços iniciais inválida.';
  end if;
  if jsonb_typeof(p_professionals) <> 'array' or jsonb_array_length(p_professionals) > 100
     or exists (
       select 1 from jsonb_to_recordset(p_professionals) as item(name text)
       where item.name is null or length(trim(item.name)) not between 2 and 100
     ) then
    raise exception using errcode = '23514', message = 'Lista de profissionais iniciais inválida.';
  end if;

  insert into public.business_profile (
    id, business_name, phone, address, niche_id, theme_id, onboarding_completed
  ) values (
    true, trim(p_business_name), nullif(trim(p_phone), ''),
    case when nullif(trim(p_address), '') is null then '{}'::jsonb else jsonb_build_object('formatted', trim(p_address)) end,
    p_niche_id, p_theme_id, true
  )
  on conflict (id) do update set
    business_name = excluded.business_name, phone = excluded.phone,
    address = excluded.address, niche_id = excluded.niche_id,
    theme_id = excluded.theme_id, onboarding_completed = true, updated_at = now()
  returning * into v_profile;

  -- Preserve capability rows and disable only currently-enabled entries.
  -- This avoids an unsafe whole-table DELETE and keeps configuration history.
  update public.feature_settings
  set enabled = false, updated_at = now()
  where enabled = true;

  foreach v_capability in array p_capabilities loop
    insert into public.feature_settings(capability, enabled) values (v_capability, true)
    on conflict (capability) do update set enabled = true, updated_at = now();
  end loop;

  update public.barbershop_config set
    name = v_profile.business_name, phone = coalesce(v_profile.phone, ''),
    address = coalesce(v_profile.address->>'formatted', ''), working_hours = p_business_hours,
    interval_minutes = p_interval_minutes, booking_window_days = p_booking_window_days,
    updated_at = now()
  where id = true;

  insert into public.booking_settings(id, interval_minutes, booking_window_days)
  values (true, p_interval_minutes, p_booking_window_days)
  on conflict (id) do update set interval_minutes = excluded.interval_minutes,
    booking_window_days = excluded.booking_window_days, updated_at = now();

  for v_service in select * from jsonb_to_recordset(p_services)
    as item(name text, duration integer, price numeric, category text)
  loop
    if length(trim(v_service.name)) between 2 and 100
       and v_service.duration between 5 and 480
       and v_service.price between 0 and 99999999.99
       and not exists (select 1 from public.services s where lower(s.name) = lower(trim(v_service.name))) then
      insert into public.services(name, duration, price, description, category)
      values (trim(v_service.name), v_service.duration, v_service.price, '', coalesce(trim(v_service.category), ''));
    end if;
  end loop;

  for v_professional in select * from jsonb_to_recordset(p_professionals) as item(name text)
  loop
    if length(trim(v_professional.name)) between 2 and 100
       and not exists (select 1 from public.barbers p where lower(p.name) = lower(trim(v_professional.name))) then
      insert into public.barbers(name, avatar, specialty, working_hours)
      values (trim(v_professional.name), '', '', p_business_hours);
    end if;
  end loop;

  return v_profile;
end;
$$;
