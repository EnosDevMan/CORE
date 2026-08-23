-- P0: safe, one-time owner bootstrap and atomic installation onboarding.
create table public.installation_owners (
  user_id uuid primary key references public.profiles(id) on delete restrict,
  claimed_at timestamptz not null default now()
);
alter table public.installation_owners enable row level security;
comment on table public.installation_owners is 'Internal bootstrap lock and canonical installation owner; no direct API policies.';

create or replace function public.auth_role()
returns public.user_role
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    when exists(select 1 from public.installation_owners where user_id = auth.uid()) then 'admin'::public.user_role
    else (select role from public.profiles where id = auth.uid())
  end;
$$;

create or replace function public.get_onboarding_state()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'completed', coalesce((select onboarding_completed from public.business_profile where id = true), false),
    'ownerExists', exists(select 1 from public.installation_owners)
      or exists(select 1 from public.profiles where role = 'admin')
  );
$$;

create or replace function public.claim_first_owner()
returns public.profiles
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile public.profiles;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'Autenticação obrigatória.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('core:first-owner', 0));

  if exists (select 1 from public.installation_owners)
     or exists (select 1 from public.profiles where role = 'admin') then
    raise exception using errcode = '42501', message = 'O proprietário inicial já foi definido.';
  end if;

  insert into public.installation_owners(user_id) values (auth.uid());

  update public.profiles
  set role = 'admin'
  where id = auth.uid()
  returning * into v_profile;

  if v_profile.id is null then
    raise exception using errcode = '42501', message = 'Perfil autenticado não encontrado.';
  end if;

  return v_profile;
end;
$$;

create or replace function public.complete_business_onboarding(
  p_business_name text,
  p_niche_id public.business_niche,
  p_theme_id text,
  p_phone text default null,
  p_address text default null,
  p_capabilities text[] default array[]::text[]
) returns public.business_profile
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile public.business_profile;
  v_capability text;
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
  if exists (
    select 1 from unnest(p_capabilities) capability
    where capability !~ '^[a-z][a-z0-9_]*$'
  ) then
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
    business_name = excluded.business_name,
    phone = excluded.phone,
    address = excluded.address,
    niche_id = excluded.niche_id,
    theme_id = excluded.theme_id,
    onboarding_completed = true,
    updated_at = now()
  returning * into v_profile;

  delete from public.feature_settings;
  foreach v_capability in array p_capabilities loop
    insert into public.feature_settings (capability, enabled)
    values (v_capability, true)
    on conflict (capability) do update set enabled = true, updated_at = now();
  end loop;

  -- Compatibility bridge while the old UI still reads barbershop_config.
  update public.barbershop_config set
    name = v_profile.business_name,
    phone = coalesce(v_profile.phone, ''),
    address = coalesce(v_profile.address->>'formatted', ''),
    updated_at = now()
  where id = true;

  insert into public.booking_settings (id) values (true)
  on conflict (id) do nothing;

  return v_profile;
end;
$$;

revoke all on function public.claim_first_owner() from public, anon;
grant execute on function public.claim_first_owner() to authenticated;
revoke all on function public.get_onboarding_state() from public, anon;
grant execute on function public.get_onboarding_state() to authenticated;
revoke all on function public.complete_business_onboarding(text, public.business_niche, text, text, text, text[]) from public, anon;
grant execute on function public.complete_business_onboarding(text, public.business_niche, text, text, text, text[]) to authenticated;
