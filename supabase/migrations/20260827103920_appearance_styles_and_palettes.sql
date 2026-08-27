-- Additive appearance evolution. theme_id remains the compatibility contract
-- and is written alongside independent style/palette columns.

alter table public.business_profile
  add column if not exists theme_style_id text,
  add column if not exists palette_id text;

create or replace function public.resolve_legacy_appearance(
  p_niche_id public.business_niche,
  p_theme_id text
) returns jsonb
language sql
immutable
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'styleId',
    case
      when p_theme_id = 'minimal_light' then 'minimal'
      when p_theme_id in ('graphite_modern', 'urban_steel') then 'modern'
      when p_theme_id = 'premium_dark' and p_niche_id <> 'pet_shop' then 'premium'
      when p_theme_id = 'heritage_copper' and p_niche_id = 'barbershop' then 'heritage'
      when p_theme_id in ('rose_elegance', 'lavender_studio') and p_niche_id = 'beauty_salon' then 'editorial'
      when p_theme_id in ('rose_elegance', 'lavender_studio', 'blush_glass') and p_niche_id = 'nail_studio' then 'showcase'
      when p_theme_id = 'champagne_blush' and p_niche_id in ('beauty_salon', 'nail_studio') then 'premium'
      when p_theme_id = 'forest_clean' and p_niche_id = 'pet_shop' then 'clean'
      when p_theme_id = 'forest_clean' and p_niche_id = 'barbershop' then 'modern'
      when p_theme_id in ('ocean_playful', 'sunshine_pet') and p_niche_id = 'pet_shop' then 'friendly'
      else case p_niche_id
        when 'barbershop' then 'modern'
        when 'beauty_salon' then 'editorial'
        when 'nail_studio' then 'showcase'
        when 'pet_shop' then 'friendly'
      end
    end,
    'paletteId',
    case
      when p_theme_id = 'minimal_light' then 'minimal_white'
      when p_theme_id = 'graphite_modern' then case p_niche_id
        when 'barbershop' then 'graphite'
        when 'beauty_salon' then 'slate'
        when 'nail_studio' then 'sophisticated_black'
        when 'pet_shop' then 'navy'
      end
      when p_theme_id = 'premium_dark' then case p_niche_id
        when 'barbershop' then 'graphite'
        when 'beauty_salon' then 'sophisticated_black'
        when 'nail_studio' then 'sophisticated_black'
        when 'pet_shop' then 'forest'
      end
      when p_theme_id = 'heritage_copper' and p_niche_id = 'barbershop' then 'copper'
      when p_theme_id = 'urban_steel' and p_niche_id = 'barbershop' then 'steel'
      when p_theme_id = 'rose_elegance' and p_niche_id in ('beauty_salon', 'nail_studio') then 'rose'
      when p_theme_id = 'champagne_blush' and p_niche_id in ('beauty_salon', 'nail_studio') then 'champagne'
      when p_theme_id = 'lavender_studio' and p_niche_id in ('beauty_salon', 'nail_studio') then 'lavender'
      when p_theme_id = 'blush_glass' and p_niche_id = 'nail_studio' then 'blush'
      when p_theme_id = 'forest_clean' and p_niche_id in ('barbershop', 'pet_shop') then 'forest'
      when p_theme_id = 'ocean_playful' and p_niche_id = 'pet_shop' then 'ocean'
      when p_theme_id = 'sunshine_pet' and p_niche_id = 'pet_shop' then 'soft_yellow'
      else case p_niche_id
        when 'barbershop' then 'graphite'
        when 'beauty_salon' then 'rose'
        when 'nail_studio' then 'lavender'
        when 'pet_shop' then 'forest'
      end
    end
  );
$$;

create or replace function public.appearance_is_available(
  p_niche_id public.business_niche,
  p_theme_style_id text,
  p_palette_id text
) returns boolean
language sql
immutable
set search_path = public, pg_temp
as $$
  select case p_niche_id
    when 'barbershop' then
      p_theme_style_id in ('modern', 'premium', 'minimal', 'heritage')
      and p_palette_id in ('graphite', 'navy', 'copper', 'forest', 'burgundy', 'steel', 'cream', 'minimal_white', 'contemporary_blue')
    when 'beauty_salon' then
      p_theme_style_id in ('modern', 'premium', 'minimal', 'editorial')
      and p_palette_id in ('rose', 'nude', 'champagne', 'lavender', 'burgundy', 'sophisticated_black', 'minimal_white', 'terracotta', 'slate')
    when 'nail_studio' then
      p_theme_style_id in ('modern', 'premium', 'minimal', 'showcase')
      and p_palette_id in ('lavender', 'blush', 'rose', 'nude', 'burgundy', 'minimal_white', 'sophisticated_black', 'champagne', 'vibrant')
    when 'pet_shop' then
      p_theme_style_id in ('modern', 'clean', 'minimal', 'friendly')
      and p_palette_id in ('forest', 'ocean', 'turquoise', 'soft_yellow', 'coral', 'navy', 'aqua', 'minimal_white', 'playful')
    else false
  end;
$$;

update public.business_profile
set
  theme_style_id = public.resolve_legacy_appearance(niche_id, theme_id)->>'styleId',
  palette_id = public.resolve_legacy_appearance(niche_id, theme_id)->>'paletteId'
where theme_style_id is null or palette_id is null;

alter table public.business_profile
  alter column theme_style_id set default 'minimal',
  alter column palette_id set default 'minimal_white',
  alter column theme_style_id set not null,
  alter column palette_id set not null;

alter table public.business_profile
  drop constraint if exists business_profile_theme_style_id_check,
  drop constraint if exists business_profile_palette_id_check,
  drop constraint if exists business_profile_appearance_niche_check;

alter table public.business_profile
  add constraint business_profile_theme_style_id_check check (theme_style_id in (
    'modern', 'premium', 'minimal', 'heritage', 'editorial', 'showcase', 'clean', 'friendly'
  )),
  add constraint business_profile_palette_id_check check (palette_id in (
    'graphite', 'navy', 'copper', 'forest', 'burgundy', 'steel', 'cream', 'minimal_white', 'contemporary_blue',
    'rose', 'nude', 'champagne', 'lavender', 'sophisticated_black', 'terracotta', 'slate', 'blush', 'vibrant',
    'ocean', 'turquoise', 'soft_yellow', 'coral', 'aqua', 'playful'
  )),
  add constraint business_profile_appearance_niche_check check (
    public.appearance_is_available(niche_id, theme_style_id, palette_id)
  );

create or replace function public.sync_legacy_business_appearance()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_appearance jsonb;
begin
  if tg_op = 'INSERT' then
    if new.theme_style_id is null
       or new.palette_id is null
       or (
         new.theme_style_id = 'minimal'
         and new.palette_id = 'minimal_white'
         and new.theme_id <> 'minimal_light'
       ) then
      v_appearance := public.resolve_legacy_appearance(new.niche_id, new.theme_id);
      new.theme_style_id := v_appearance->>'styleId';
      new.palette_id := v_appearance->>'paletteId';
    end if;
  elsif (new.theme_id is distinct from old.theme_id or new.niche_id is distinct from old.niche_id)
        and new.theme_style_id is not distinct from old.theme_style_id
        and new.palette_id is not distinct from old.palette_id then
    v_appearance := public.resolve_legacy_appearance(new.niche_id, new.theme_id);
    new.theme_style_id := v_appearance->>'styleId';
    new.palette_id := v_appearance->>'paletteId';
  end if;
  return new;
end;
$$;

drop trigger if exists business_profile_sync_legacy_appearance on public.business_profile;
create trigger business_profile_sync_legacy_appearance
  before insert or update of niche_id, theme_id on public.business_profile
  for each row execute procedure public.sync_legacy_business_appearance();

-- New named-argument overload. The original 12-argument RPC is intentionally
-- retained so clients deployed before this migration continue onboarding.
create or replace function public.complete_business_onboarding(
  p_business_name text,
  p_niche_id public.business_niche,
  p_theme_id text,
  p_theme_style_id text,
  p_palette_id text,
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
begin
  if not public.appearance_is_available(p_niche_id, p_theme_style_id, p_palette_id) then
    raise exception using errcode = '23514', message = 'Aparência indisponível para o nicho informado.';
  end if;

  select * into v_profile
  from public.complete_business_onboarding(
    p_business_name,
    p_niche_id,
    p_theme_id,
    p_phone,
    p_address,
    p_capabilities,
    p_business_hours,
    p_services,
    p_professionals,
    p_interval_minutes,
    p_booking_window_days,
    p_setup_code
  );

  update public.business_profile
  set theme_style_id = p_theme_style_id,
      palette_id = p_palette_id,
      updated_at = now()
  where id = true
  returning * into v_profile;

  return v_profile;
end;
$$;

comment on column public.business_profile.theme_id is
  'Legacy compatibility alias. New clients persist theme_style_id and palette_id independently.';
comment on column public.business_profile.theme_style_id is
  'Structural public-site style selected from the niche registry.';
comment on column public.business_profile.palette_id is
  'Independent brand colour palette selected from the niche registry.';

revoke all on function public.resolve_legacy_appearance(public.business_niche, text) from public, anon, authenticated;
revoke all on function public.appearance_is_available(public.business_niche, text, text) from public, anon, authenticated;
revoke all on function public.sync_legacy_business_appearance() from public, anon, authenticated;
grant execute on function public.resolve_legacy_appearance(public.business_niche, text) to authenticated;
grant execute on function public.appearance_is_available(public.business_niche, text, text) to authenticated;
revoke all on function public.complete_business_onboarding(text, public.business_niche, text, text, text, text, text, text[], jsonb, jsonb, jsonb, integer, integer, text) from public, anon;
grant execute on function public.complete_business_onboarding(text, public.business_niche, text, text, text, text, text, text[], jsonb, jsonb, jsonb, integer, integer, text) to authenticated;
