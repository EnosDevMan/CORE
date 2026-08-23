-- P0: snapshot appointment duration and enforce non-overlap in PostgreSQL.
-- The legacy date/time/service_id columns remain during the compatibility
-- window, but are no longer the database's source of truth for conflicts.
create extension if not exists btree_gist;

alter table public.bookings
  add column starts_at timestamptz,
  add column ends_at timestamptz,
  add column duration_minutes integer;

create table public.booking_services (
  booking_id uuid not null references public.bookings(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  position smallint not null check (position >= 0),
  name_snapshot text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  price_snapshot numeric(10,2) not null check (price_snapshot >= 0),
  primary key (booking_id, service_id),
  unique (booking_id, position)
);

create index booking_services_service_idx on public.booking_services(service_id);
alter table public.booking_services enable row level security;

create policy booking_services_select_with_booking on public.booking_services
for select using (
  exists (select 1 from public.bookings b where b.id = booking_id)
);
create policy booking_services_admin_write on public.booking_services
for all using (public.auth_role() = 'admin') with check (public.auth_role() = 'admin');

create or replace function public.snapshot_booking_interval()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_duration integer;
  v_timezone text;
begin
  if tg_op = 'UPDATE'
     and old.starts_at is not null
     and old.ends_at is not null
     and old.duration_minutes is not null
     and new.date is not distinct from old.date
     and new.time is not distinct from old.time
     and new.service_id is not distinct from old.service_id then
    return new;
  end if;

  select coalesce(sum(s.duration), 0)::integer into v_duration
  from public.services s
  where s.id::text = any(string_to_array(new.service_id, ','));

  if v_duration <= 0 then
    raise exception using errcode = '23514', message = 'Agendamento sem serviço válido.';
  end if;

  select coalesce(
    (select bp.timezone from public.business_profile bp where bp.id = true),
    'America/Sao_Paulo'
  ) into v_timezone;

  new.duration_minutes := v_duration;
  new.starts_at := (new.date + new.time) at time zone v_timezone;
  new.ends_at := new.starts_at + make_interval(mins => v_duration);
  return new;
end;
$$;

create trigger bookings_snapshot_interval
before insert or update of date, time, service_id on public.bookings
for each row execute function public.snapshot_booking_interval();

-- Invokes the trigger for all legacy records and intentionally aborts when a
-- booking references no valid service. Bad data must be corrected, not hidden.
-- The existing privilege trigger rejects maintenance UPDATEs without an Auth
-- session, so it is disabled only for this transactional backfill.
alter table public.bookings disable trigger bookings_protect_updates;
update public.bookings set service_id = service_id;
alter table public.bookings enable trigger bookings_protect_updates;

alter table public.bookings
  alter column starts_at set not null,
  alter column ends_at set not null,
  alter column duration_minutes set not null,
  add constraint bookings_positive_interval check (
    duration_minutes > 0 and ends_at > starts_at
  );

-- This is the definitive double-booking barrier. Concurrent transactions can
-- no longer insert overlapping active appointments for one professional.
alter table public.bookings add constraint bookings_no_professional_overlap
exclude using gist (
  barber_id with =,
  tstzrange(starts_at, ends_at, '[)') with &&
)
where (status <> 'Cancelado');

create or replace function public.sync_booking_service_items()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  delete from public.booking_services where booking_id = new.id;

  insert into public.booking_services (
    booking_id, service_id, position, name_snapshot, duration_minutes, price_snapshot
  )
  select new.id, s.id, requested.ordinality - 1, s.name, s.duration, s.price
  from unnest(string_to_array(new.service_id, ',')) with ordinality requested(id, ordinality)
  join public.services s on s.id::text = trim(requested.id)
  order by requested.ordinality;

  return new;
end;
$$;

create trigger bookings_sync_service_items
after insert or update of service_id on public.bookings
for each row execute function public.sync_booking_service_items();

-- Backfill normalized service lines after installing the synchronization trigger.
insert into public.booking_services (
  booking_id, service_id, position, name_snapshot, duration_minutes, price_snapshot
)
select b.id, s.id, requested.ordinality - 1, s.name, s.duration, s.price
from public.bookings b
cross join lateral unnest(string_to_array(b.service_id, ','))
  with ordinality requested(id, ordinality)
join public.services s on s.id::text = trim(requested.id)
order by b.id, requested.ordinality;

comment on column public.bookings.starts_at is 'Immutable scheduling instant snapshot in UTC.';
comment on column public.bookings.duration_minutes is 'Service duration snapshot used by conflict enforcement.';
comment on table public.booking_services is 'Normalized service lines with historical name/duration/price snapshots.';
