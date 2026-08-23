-- P1: complete onboarding with hours, starter services, team and booking rules.
revoke all on function public.complete_business_onboarding(text, public.business_niche, text, text, text, text[]) from public, anon, authenticated;
drop function public.complete_business_onboarding(text, public.business_niche, text, text, text, text[]);

create function public.complete_business_onboarding(
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
  p_booking_window_days integer
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
  if public.auth_role() <> 'admin' then
    raise exception using errcode = '42501', message = 'Somente o proprietário pode concluir a configuração inicial.';
  end if;
  if length(trim(p_business_name)) < 2 then
    raise exception using errcode = '23514', message = 'Informe um nome de negócio válido.';
  end if;
  if p_theme_id !~ '^[a-z][a-z0-9_]*$' then
    raise exception using errcode = '23514', message = 'Tema inválido.';
  end if;
  if p_business_hours->>'open' !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
     or p_business_hours->>'close' !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
     or (p_business_hours->>'open')::time >= (p_business_hours->>'close')::time
     or jsonb_typeof(p_business_hours->'daysOpen') <> 'array' then
    raise exception using errcode = '23514', message = 'Horário de funcionamento inválido.';
  end if;
  if p_interval_minutes < 5 or p_interval_minutes > 480
     or p_booking_window_days < 1 or p_booking_window_days > 365 then
    raise exception using errcode = '23514', message = 'Configuração da agenda inválida.';
  end if;
  if exists (select 1 from unnest(p_capabilities) item where item !~ '^[a-z][a-z0-9_]*$') then
    raise exception using errcode = '23514', message = 'Capability inválida.';
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

  delete from public.feature_settings;
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
    as item(name text, duration integer, category text)
  loop
    if length(trim(v_service.name)) between 2 and 100
       and v_service.duration between 5 and 480
       and not exists (select 1 from public.services s where lower(s.name) = lower(trim(v_service.name))) then
      insert into public.services(name, duration, price, description, category)
      values (trim(v_service.name), v_service.duration, 0, '', coalesce(trim(v_service.category), ''));
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

revoke all on function public.complete_business_onboarding(text, public.business_niche, text, text, text, text[], jsonb, jsonb, jsonb, integer, integer) from public, anon;
grant execute on function public.complete_business_onboarding(text, public.business_niche, text, text, text, text[], jsonb, jsonb, jsonb, integer, integer) to authenticated;
