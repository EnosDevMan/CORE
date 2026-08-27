-- Separate art direction, brand colours and surface luminosity without
-- breaking installations that still persist/read the legacy theme_id alias.

alter table public.business_profile
  add column if not exists surface_mode text,
  add column if not exists custom_primary_color text,
  add column if not exists custom_secondary_color text,
  add column if not exists custom_accent_color text;

-- Preserve the visual luminosity of the curated palettes that existed before
-- surface mode became independent. Every palette can be changed to either mode
-- after this backfill.
update public.business_profile
set surface_mode = case
  when palette_id in ('graphite', 'navy', 'steel', 'sophisticated_black') then 'dark'
  else 'light'
end
where surface_mode is null;

alter table public.business_profile
  alter column surface_mode set default 'light',
  alter column surface_mode set not null;

alter table public.business_profile
  drop constraint if exists business_profile_palette_id_check,
  drop constraint if exists business_profile_appearance_niche_check,
  drop constraint if exists business_profile_surface_mode_check,
  drop constraint if exists business_profile_custom_primary_color_check,
  drop constraint if exists business_profile_custom_secondary_color_check,
  drop constraint if exists business_profile_custom_accent_color_check,
  drop constraint if exists business_profile_custom_palette_check;

alter table public.business_profile
  add constraint business_profile_palette_id_check check (palette_id in (
    'graphite', 'navy', 'copper', 'forest', 'burgundy', 'steel', 'cream', 'minimal_white', 'contemporary_blue',
    'rose', 'nude', 'champagne', 'lavender', 'sophisticated_black', 'terracotta', 'slate', 'blush', 'vibrant',
    'ocean', 'turquoise', 'soft_yellow', 'coral', 'aqua', 'playful', 'custom'
  )),
  add constraint business_profile_surface_mode_check check (surface_mode in ('light', 'dark')),
  add constraint business_profile_custom_primary_color_check check (
    custom_primary_color is null or custom_primary_color ~ '^#[0-9A-Fa-f]{6}$'
  ),
  add constraint business_profile_custom_secondary_color_check check (
    custom_secondary_color is null or custom_secondary_color ~ '^#[0-9A-Fa-f]{6}$'
  ),
  add constraint business_profile_custom_accent_color_check check (
    custom_accent_color is null or custom_accent_color ~ '^#[0-9A-Fa-f]{6}$'
  ),
  add constraint business_profile_custom_palette_check check (
    (
      palette_id = 'custom'
      and custom_primary_color is not null
      and custom_secondary_color is not null
      and custom_accent_color is not null
    )
    or (
      palette_id <> 'custom'
      and custom_primary_color is null
      and custom_secondary_color is null
      and custom_accent_color is null
    )
  );

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
      and (p_palette_id = 'custom' or p_palette_id in ('graphite', 'navy', 'copper', 'forest', 'burgundy', 'steel', 'cream', 'minimal_white', 'contemporary_blue'))
    when 'beauty_salon' then
      p_theme_style_id in ('modern', 'premium', 'minimal', 'editorial')
      and (p_palette_id = 'custom' or p_palette_id in ('rose', 'nude', 'champagne', 'lavender', 'burgundy', 'sophisticated_black', 'minimal_white', 'terracotta', 'slate'))
    when 'nail_studio' then
      p_theme_style_id in ('modern', 'premium', 'minimal', 'showcase')
      and (p_palette_id = 'custom' or p_palette_id in ('lavender', 'blush', 'rose', 'nude', 'burgundy', 'minimal_white', 'sophisticated_black', 'champagne', 'vibrant'))
    when 'pet_shop' then
      p_theme_style_id in ('modern', 'clean', 'minimal', 'friendly')
      and (p_palette_id = 'custom' or p_palette_id in ('forest', 'ocean', 'turquoise', 'soft_yellow', 'coral', 'navy', 'aqua', 'minimal_white', 'playful'))
    else false
  end;
$$;

alter table public.business_profile
  add constraint business_profile_appearance_niche_check check (
    public.appearance_is_available(niche_id, theme_style_id, palette_id)
  );

-- Old clients update theme_id only. Keep that compatibility path deterministic:
-- sync the structural style, curated palette and its historical luminosity,
-- and never leave custom colours attached to a legacy write.
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
      new.surface_mode := case
        when new.palette_id in ('graphite', 'navy', 'steel', 'sophisticated_black') then 'dark'
        else 'light'
      end;
      new.custom_primary_color := null;
      new.custom_secondary_color := null;
      new.custom_accent_color := null;
    end if;
  elsif (new.theme_id is distinct from old.theme_id or new.niche_id is distinct from old.niche_id)
        and new.theme_style_id is not distinct from old.theme_style_id
        and new.palette_id is not distinct from old.palette_id then
    v_appearance := public.resolve_legacy_appearance(new.niche_id, new.theme_id);
    new.theme_style_id := v_appearance->>'styleId';
    new.palette_id := v_appearance->>'paletteId';
    new.surface_mode := case
      when new.palette_id in ('graphite', 'navy', 'steel', 'sophisticated_black') then 'dark'
      else 'light'
    end;
    new.custom_primary_color := null;
    new.custom_secondary_color := null;
    new.custom_accent_color := null;
  end if;
  return new;
end;
$$;

comment on column public.business_profile.palette_id is
  'Independent brand colour family. custom stores the owner supplied three-colour identity.';
comment on column public.business_profile.surface_mode is
  'Independent public-site surface luminosity: light or dark.';
comment on column public.business_profile.custom_primary_color is
  'Owner brand primary colour when palette_id=custom.';
comment on column public.business_profile.custom_secondary_color is
  'Owner brand secondary colour when palette_id=custom.';
comment on column public.business_profile.custom_accent_color is
  'Owner brand accent colour when palette_id=custom.';

-- New onboarding overload. Previous signatures remain available so deployments
-- from before this migration continue to complete setup. For a custom palette,
-- bootstrap through a valid curated palette and switch to the custom identity
-- inside the same transaction so the custom-colour constraint is never broken.
create or replace function public.complete_business_onboarding(
  p_business_name text,
  p_niche_id public.business_niche,
  p_theme_id text,
  p_theme_style_id text,
  p_palette_id text,
  p_surface_mode text,
  p_custom_primary_color text,
  p_custom_secondary_color text,
  p_custom_accent_color text,
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
  v_bootstrap_palette text;
begin
  if not public.appearance_is_available(p_niche_id, p_theme_style_id, p_palette_id) then
    raise exception using errcode = '23514', message = 'Aparência indisponível para o nicho informado.';
  end if;
  if p_surface_mode not in ('light', 'dark') then
    raise exception using errcode = '23514', message = 'Fundo da aparência inválido.';
  end if;
  if p_palette_id = 'custom' then
    if p_custom_primary_color is null or p_custom_primary_color !~ '^#[0-9A-Fa-f]{6}$'
       or p_custom_secondary_color is null or p_custom_secondary_color !~ '^#[0-9A-Fa-f]{6}$'
       or p_custom_accent_color is null or p_custom_accent_color !~ '^#[0-9A-Fa-f]{6}$' then
      raise exception using errcode = '23514', message = 'Cores personalizadas inválidas.';
    end if;
    v_bootstrap_palette := case p_niche_id
      when 'barbershop' then 'graphite'
      when 'beauty_salon' then 'rose'
      when 'nail_studio' then 'lavender'
      when 'pet_shop' then 'forest'
    end;
  else
    if p_custom_primary_color is not null or p_custom_secondary_color is not null or p_custom_accent_color is not null then
      raise exception using errcode = '23514', message = 'Cores personalizadas só podem ser usadas com a paleta personalizada.';
    end if;
    v_bootstrap_palette := p_palette_id;
  end if;

  select * into v_profile
  from public.complete_business_onboarding(
    p_business_name,
    p_niche_id,
    p_theme_id,
    p_theme_style_id,
    v_bootstrap_palette,
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
  set theme_id = p_theme_id,
      theme_style_id = p_theme_style_id,
      palette_id = p_palette_id,
      surface_mode = p_surface_mode,
      custom_primary_color = case when p_palette_id = 'custom' then lower(p_custom_primary_color) else null end,
      custom_secondary_color = case when p_palette_id = 'custom' then lower(p_custom_secondary_color) else null end,
      custom_accent_color = case when p_palette_id = 'custom' then lower(p_custom_accent_color) else null end,
      updated_at = now()
  where id = true
  returning * into v_profile;

  return v_profile;
end;
$$;

revoke all on function public.complete_business_onboarding(
  text, public.business_niche, text, text, text, text, text, text, text,
  text, text, text[], jsonb, jsonb, jsonb, integer, integer, text
) from public, anon;
grant execute on function public.complete_business_onboarding(
  text, public.business_niche, text, text, text, text, text, text, text,
  text, text, text[], jsonb, jsonb, jsonb, integer, integer, text
) to authenticated;
