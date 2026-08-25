begin;

alter table public.barbershop_config
  add column if not exists minimum_notice_minutes integer not null default 30,
  add column if not exists cancellation_notice_minutes integer not null default 0;

alter table public.barbershop_config
  drop constraint if exists barbershop_config_minimum_notice_minutes_check,
  drop constraint if exists barbershop_config_cancellation_notice_minutes_check,
  add constraint barbershop_config_minimum_notice_minutes_check
    check (minimum_notice_minutes between 0 and 525600),
  add constraint barbershop_config_cancellation_notice_minutes_check
    check (cancellation_notice_minutes between 0 and 525600);

alter table public.booking_settings
  drop constraint if exists booking_settings_minimum_notice_minutes_check,
  drop constraint if exists booking_settings_cancellation_notice_minutes_check,
  add constraint booking_settings_minimum_notice_minutes_check
    check (minimum_notice_minutes between 0 and 525600),
  add constraint booking_settings_cancellation_notice_minutes_check
    check (cancellation_notice_minutes between 0 and 525600);

update public.barbershop_config config
set minimum_notice_minutes = settings.minimum_notice_minutes,
    cancellation_notice_minutes = settings.cancellation_notice_minutes
from public.booking_settings settings
where config.id = true and settings.id = true;

create or replace function public.sync_booking_settings_from_config()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.booking_settings (
    id, interval_minutes, booking_window_days,
    minimum_notice_minutes, cancellation_notice_minutes
  ) values (
    true, new.interval_minutes, new.booking_window_days,
    new.minimum_notice_minutes, new.cancellation_notice_minutes
  )
  on conflict (id) do update set
    interval_minutes = excluded.interval_minutes,
    booking_window_days = excluded.booking_window_days,
    minimum_notice_minutes = excluded.minimum_notice_minutes,
    cancellation_notice_minutes = excluded.cancellation_notice_minutes,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists config_sync_booking_settings on public.barbershop_config;
create trigger config_sync_booking_settings
after update of interval_minutes, booking_window_days,
  minimum_notice_minutes, cancellation_notice_minutes
on public.barbershop_config
for each row execute function public.sync_booking_settings_from_config();

revoke all on function public.sync_booking_settings_from_config() from public, anon, authenticated;

commit;
