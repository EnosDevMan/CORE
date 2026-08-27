-- Owner changes made in the legacy Admin Settings row must update the
-- canonical public runtime in the same transaction. Branding flows the other
-- direction: business_profile is canonical for uploaded logo URLs.
begin;

insert into auth.users(id, email, email_confirmed_at, raw_user_meta_data)
values (
  '24000000-0000-4000-8000-000000000001',
  'identity-owner@example.test',
  now(),
  '{"name":"Identity Owner"}'
);
update public.profiles
set role = 'owner'
where id = '24000000-0000-4000-8000-000000000001';

insert into public.business_profile (
  id, business_name, niche_id, theme_id, theme_style_id, palette_id,
  surface_mode, onboarding_completed
) values (
  true, 'Nome Inicial', 'barbershop', 'minimal_light', 'minimal',
  'minimal_white', 'light', true
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '24000000-0000-4000-8000-000000000001', true);

update public.barbershop_config
set name = 'Nome Atualizado',
    phone = '83996822057',
    address = 'Rua Sincronizada 123',
    social_links = jsonb_build_object(
      'instagram', 'https://instagram.com/core.test',
      'facebook', 'https://facebook.com/core.test'
    )
where id = true;

do $$
declare
  v_profile public.business_profile;
begin
  select * into v_profile from public.business_profile where id = true;
  if v_profile.business_name <> 'Nome Atualizado'
     or v_profile.phone <> '83996822057'
     or v_profile.whatsapp <> '83996822057'
     or v_profile.address->>'formatted' <> 'Rua Sincronizada 123'
     or v_profile.instagram <> 'https://instagram.com/core.test'
     or v_profile.facebook <> 'https://facebook.com/core.test' then
    raise exception 'TEST FAILURE: Admin Settings identity did not reach business_profile';
  end if;
end;
$$;

update public.business_profile
set logo_url = 'https://assets.example.test/logo.webp'
where id = true;

do $$
begin
  if (select logo from public.barbershop_config where id = true)
     <> 'https://assets.example.test/logo.webp' then
    raise exception 'TEST FAILURE: canonical logo did not reach legacy config';
  end if;
end;
$$;

-- Saving an old config snapshot must not erase the canonical uploaded logo.
update public.barbershop_config set logo = '' where id = true;

do $$
begin
  if (select logo from public.barbershop_config where id = true)
     <> 'https://assets.example.test/logo.webp' then
    raise exception 'TEST FAILURE: stale Admin Settings snapshot erased canonical logo';
  end if;

  if has_function_privilege('authenticated', 'public.sync_business_profile_from_config()', 'EXECUTE')
     or has_function_privilege('anon', 'public.sync_business_profile_from_config()', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.preserve_canonical_config_logo()', 'EXECUTE')
     or has_function_privilege('anon', 'public.preserve_canonical_config_logo()', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.sync_legacy_config_logo_from_profile()', 'EXECUTE')
     or has_function_privilege('anon', 'public.sync_legacy_config_logo_from_profile()', 'EXECUTE') then
    raise exception 'TEST FAILURE: trigger-only synchronization helper is browser executable';
  end if;
end;
$$;

rollback;
