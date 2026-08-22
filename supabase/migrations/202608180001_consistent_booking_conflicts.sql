-- Guarantee the same overlap rules used by the availability UI for every
-- database write. Previous RPC checks added the cleanup interval only to the
-- incoming booking, so a booking could start during the interval immediately
-- after an existing appointment. A trigger also protects direct table writes.

create or replace function public.prevent_booking_schedule_conflicts()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_duration int;
  v_interval int;
  v_start_mins int;
  v_end_mins int;
begin
  if tg_op = 'UPDATE'
     and new.barber_id is not distinct from old.barber_id
     and new.service_id is not distinct from old.service_id
     and new.date is not distinct from old.date
     and new.time is not distinct from old.time then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(new.barber_id::text || new.date::text, 0));

  select coalesce(sum(duration), 0) into v_duration
  from services
  where active = true and id::text = any(string_to_array(new.service_id, ','));
  select coalesce(interval_minutes, 0) into v_interval
  from barbershop_config where id = true;

  if v_duration <= 0 then return new; end if;

  v_start_mins := extract(hour from new.time) * 60 + extract(minute from new.time);
  v_end_mins := v_start_mins + v_duration + v_interval;

  if exists (
    select 1 from bookings b
    where b.barber_id = new.barber_id
      and b.date = new.date
      and b.id is distinct from new.id
      and b.status <> 'Cancelado'
      and (extract(hour from b.time) * 60 + extract(minute from b.time)) < v_end_mins
      and (extract(hour from b.time) * 60 + extract(minute from b.time))
          + coalesce((select sum(s.duration) from services s where s.id::text = any(string_to_array(b.service_id, ','))), 30)
          + v_interval > v_start_mins
  ) then
    raise exception 'Horário indisponível: já existe um agendamento neste intervalo.';
  end if;

  return new;
end;
$$;

drop trigger if exists bookings_prevent_schedule_conflicts on public.bookings;
create trigger bookings_prevent_schedule_conflicts
before insert or update of barber_id, service_id, date, time on public.bookings
for each row execute function public.prevent_booking_schedule_conflicts();

revoke all on function public.prevent_booking_schedule_conflicts() from public;
