-- Incremental, idempotent production hardening for gallery ordering and bounded reads.
begin;

alter table public.gallery_photos
  add column if not exists display_order integer;

update public.gallery_photos
set display_order = coalesce("order", 0)
where display_order is null;

alter table public.gallery_photos
  alter column display_order set default 0,
  alter column display_order set not null;

create index if not exists gallery_photos_display_order_idx
  on public.gallery_photos (display_order, created_at, id);
create index if not exists bookings_date_id_idx
  on public.bookings (date desc, id);
create index if not exists profiles_created_at_id_idx
  on public.profiles (created_at desc, id);

-- Funções SECURITY DEFINER não devem herdar EXECUTE de PUBLIC.
revoke all on function public.create_booking(uuid, text, text, uuid, text, date, time, text, numeric) from public;
grant execute on function public.create_booking(uuid, text, text, uuid, text, date, time, text, numeric) to anon, authenticated;
revoke all on function public.reschedule_booking(uuid, date, time) from public, anon;
grant execute on function public.reschedule_booking(uuid, date, time) to authenticated;

commit;
