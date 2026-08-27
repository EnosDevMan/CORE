begin;

insert into public.business_profile (
  id, business_name, niche_id, theme_id, theme_style_id, palette_id,
  surface_mode, onboarding_completed
) values (
  true, 'Appearance Test', 'barbershop', 'urban_steel', 'modern', 'steel',
  'dark', false
);

update public.business_profile set surface_mode = 'light' where id = true;

update public.business_profile
set palette_id = 'custom',
    surface_mode = 'dark',
    custom_primary_color = '#315f96',
    custom_secondary_color = '#d9e7f2',
    custom_accent_color = '#c9975b'
where id = true;

do $$
declare
  v_profile public.business_profile;
begin
  select * into v_profile from public.business_profile where id = true;
  if v_profile.palette_id <> 'custom' or v_profile.surface_mode <> 'dark' then
    raise exception 'appearance custom palette regression';
  end if;

  if not public.appearance_is_available('barbershop', 'modern', 'custom') then
    raise exception 'custom palette should be available';
  end if;

  if public.appearance_is_available('pet_shop', 'heritage', 'custom') then
    raise exception 'invalid niche style accepted';
  end if;

  begin
    update public.business_profile set surface_mode = 'invalid' where id = true;
    raise exception 'invalid surface mode accepted';
  exception when check_violation then
    null;
  end;

  begin
    update public.business_profile set custom_primary_color = null where id = true;
    raise exception 'incomplete custom palette accepted';
  exception when check_violation then
    null;
  end;
end;
$$;

update public.business_profile set theme_id = 'minimal_light' where id = true;

do $$
declare
  v_profile public.business_profile;
begin
  select * into v_profile from public.business_profile where id = true;
  if v_profile.theme_style_id <> 'minimal'
     or v_profile.palette_id <> 'minimal_white'
     or v_profile.surface_mode <> 'light'
     or v_profile.custom_primary_color is not null
     or v_profile.custom_secondary_color is not null
     or v_profile.custom_accent_color is not null then
    raise exception 'legacy appearance sync regression';
  end if;
end;
$$;

rollback;
