-- Universal, single-installation business configuration. This migration is
-- additive so existing barbershop installations can migrate without downtime.
create type public.business_niche as enum ('barbershop', 'beauty_salon', 'nail_studio', 'pet_shop');

create table public.business_profile (
  id boolean primary key default true constraint business_profile_singleton check (id),
  business_name text not null,
  description text,
  logo_url text,
  cover_url text,
  favicon_url text,
  phone text,
  whatsapp text,
  email text,
  instagram text,
  facebook text,
  website text,
  address jsonb not null default '{}'::jsonb,
  timezone text not null default 'America/Sao_Paulo',
  currency char(3) not null default 'BRL',
  locale text not null default 'pt-BR',
  niche_id public.business_niche not null,
  theme_id text not null default 'minimal_light',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.feature_settings (
  capability text primary key check (capability ~ '^[a-z][a-z0-9_]*$'),
  enabled boolean not null default false,
  configuration jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.booking_settings (
  id boolean primary key default true constraint booking_settings_singleton check (id),
  interval_minutes integer not null default 30 check (interval_minutes between 5 and 480),
  booking_window_days integer not null default 30 check (booking_window_days between 1 and 365),
  minimum_notice_minutes integer not null default 0 check (minimum_notice_minutes >= 0),
  cancellation_notice_minutes integer not null default 0 check (cancellation_notice_minutes >= 0),
  updated_at timestamptz not null default now()
);

alter table public.business_profile enable row level security;
alter table public.feature_settings enable row level security;
alter table public.booking_settings enable row level security;

create policy business_profile_public_read on public.business_profile for select using (true);
create policy business_profile_admin_write on public.business_profile for all
  using (public.auth_role() = 'admin') with check (public.auth_role() = 'admin');
create policy feature_settings_public_read on public.feature_settings for select using (true);
create policy feature_settings_admin_write on public.feature_settings for all
  using (public.auth_role() = 'admin') with check (public.auth_role() = 'admin');
create policy booking_settings_public_read on public.booking_settings for select using (true);
create policy booking_settings_admin_write on public.booking_settings for all
  using (public.auth_role() = 'admin') with check (public.auth_role() = 'admin');

comment on table public.business_profile is 'Singleton identity of this independent installation.';
comment on table public.feature_settings is 'Central capability switches; billing is intentionally out of scope.';
