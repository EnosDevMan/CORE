-- Keep the legacy admin configuration and the canonical public business
-- identity coherent. Admin Settings still writes barbershop_config during the
-- compatibility window, while BusinessBrand/metadata read business_profile.

create or replace function public.sync_business_profile_from_config()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.business_profile
  set business_name = btrim(new.name),
      phone = nullif(btrim(new.phone), ''),
      whatsapp = nullif(btrim(new.phone), ''),
      address = case
        when nullif(btrim(new.address), '') is null then '{}'::jsonb
        else jsonb_build_object('formatted', btrim(new.address))
      end,
      instagram = nullif(btrim(new.social_links->>'instagram'), ''),
      facebook = nullif(btrim(new.social_links->>'facebook'), '')
  where id = true;
  return new;
end;
$$;

revoke all on function public.sync_business_profile_from_config()
from public, anon, authenticated;
grant execute on function public.sync_business_profile_from_config() to service_role;

drop trigger if exists config_sync_business_profile on public.barbershop_config;
create trigger config_sync_business_profile
after insert or update of name, address, phone, social_links
on public.barbershop_config
for each row execute function public.sync_business_profile_from_config();

-- business_profile is canonical for uploaded branding. Prevent a stale legacy
-- config snapshot from erasing that mirror when Admin Settings saves unrelated
-- fields, then mirror genuine profile logo changes back to compatibility data.
create or replace function public.preserve_canonical_config_logo()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.logo := coalesce((
    select profile.logo_url
    from public.business_profile profile
    where profile.id = true
  ), '');
  return new;
end;
$$;

revoke all on function public.preserve_canonical_config_logo()
from public, anon, authenticated;
grant execute on function public.preserve_canonical_config_logo() to service_role;

drop trigger if exists config_preserve_canonical_logo on public.barbershop_config;
create trigger config_preserve_canonical_logo
before update of logo on public.barbershop_config
for each row execute function public.preserve_canonical_config_logo();

create or replace function public.sync_legacy_config_logo_from_profile()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.barbershop_config
  set logo = coalesce(new.logo_url, '')
  where id = true
    and logo is distinct from coalesce(new.logo_url, '');
  return new;
end;
$$;

revoke all on function public.sync_legacy_config_logo_from_profile()
from public, anon, authenticated;
grant execute on function public.sync_legacy_config_logo_from_profile() to service_role;

drop trigger if exists business_profile_sync_legacy_config_logo on public.business_profile;
create trigger business_profile_sync_legacy_config_logo
after insert or update of logo_url on public.business_profile
for each row execute function public.sync_legacy_config_logo_from_profile();

-- Repair drift that already exists in installations upgraded from the legacy
-- configuration model. These updates intentionally choose the current Admin
-- Settings values for text/contact identity and business_profile for branding.
update public.business_profile profile
set business_name = btrim(config.name),
    phone = nullif(btrim(config.phone), ''),
    whatsapp = nullif(btrim(config.phone), ''),
    address = case
      when nullif(btrim(config.address), '') is null then '{}'::jsonb
      else jsonb_build_object('formatted', btrim(config.address))
    end,
    instagram = nullif(btrim(config.social_links->>'instagram'), ''),
    facebook = nullif(btrim(config.social_links->>'facebook'), '')
from public.barbershop_config config
where profile.id = true
  and config.id = true;

update public.barbershop_config config
set logo = coalesce(profile.logo_url, '')
from public.business_profile profile
where config.id = true
  and profile.id = true
  and config.logo is distinct from coalesce(profile.logo_url, '');
