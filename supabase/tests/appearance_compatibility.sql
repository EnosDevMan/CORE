-- Legacy theme writes, independent updates and invalid combinations.
begin;

insert into public.business_profile (
  id, business_name, niche_id, theme_id, theme_style_id, palette_id
) values (
  true, 'Appearance Test', 'barbershop', 'minimal_light', 'minimal', 'minimal_white'
)
on conflict (id) do update set
  niche_id = excluded.niche_id,
  theme_id = excluded.theme_id,
  theme_style_id = excluded.theme_style_id,
  palette_id = excluded.palette_id;

-- Simulate a deployed client that still writes only theme_id.
update public.business_profile
set theme_id = 'heritage_copper'
where id = true;

do $$
begin
  if not exists (
    select 1 from public.business_profile
    where id = true and theme_id = 'heritage_copper'
      and theme_style_id = 'heritage' and palette_id = 'copper'
  ) then
    raise exception 'TEST FAILURE: legacy theme_id was not synchronized';
  end if;
end;
$$;

-- Palette-only and style-only changes preserve the other independent value.
update public.business_profile
set theme_id = 'forest_clean', theme_style_id = 'modern', palette_id = 'forest'
where id = true;
update public.business_profile
set theme_style_id = 'minimal'
where id = true;

do $$
begin
  if not exists (
    select 1 from public.business_profile
    where id = true and theme_style_id = 'minimal' and palette_id = 'forest'
  ) then
    raise exception 'TEST FAILURE: independent appearance update was not persisted';
  end if;

  begin
    update public.business_profile
    set niche_id = 'pet_shop', theme_style_id = 'heritage', palette_id = 'forest'
    where id = true;
    raise exception 'TEST FAILURE: invalid niche/style combination was accepted';
  exception when check_violation then
    null;
  end;

  if to_regprocedure('public.complete_business_onboarding(text,public.business_niche,text,text,text,text,text,text[],jsonb,jsonb,jsonb,integer,integer,text)') is null then
    raise exception 'TEST FAILURE: new onboarding overload is missing';
  end if;

  if not has_function_privilege('authenticated', 'public.resolve_legacy_appearance(public.business_niche,text)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.appearance_is_available(public.business_niche,text,text)', 'EXECUTE') then
    raise exception 'TEST FAILURE: authenticated profile updates cannot execute appearance constraints';
  end if;

  if has_function_privilege('authenticated', 'public.sync_legacy_business_appearance()', 'EXECUTE') then
    raise exception 'TEST FAILURE: trigger function is directly executable';
  end if;
end;
$$;

rollback;
