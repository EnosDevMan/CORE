-- Keep the legacy physical table compatible while making fresh/default state universal.
-- Existing configured business names are intentionally left untouched.
alter table public.barbershop_config
  alter column name set default 'CORE';

comment on table public.barbershop_config is
  'Legacy physical compatibility configuration for the single CORE business installation. Application code uses the neutral BusinessConfig contract.';

comment on column public.barbershop_config.name is
  'Compatibility business name. Fresh installations use the neutral CORE default until onboarding persists the real business identity.';
