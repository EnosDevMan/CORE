-- Keep the database theme contract aligned with the frontend theme registry.
-- Unknown theme ids must be rejected at the database boundary instead of
-- silently falling back in the client.

alter table public.business_profile
  drop constraint if exists business_profile_theme_id_check;

alter table public.business_profile
  add constraint business_profile_theme_id_check
  check (theme_id in (
    'minimal_light',
    'graphite_modern',
    'premium_dark',
    'heritage_copper',
    'urban_steel',
    'rose_elegance',
    'champagne_blush',
    'lavender_studio',
    'blush_glass',
    'forest_clean',
    'ocean_playful',
    'sunshine_pet'
  ));
