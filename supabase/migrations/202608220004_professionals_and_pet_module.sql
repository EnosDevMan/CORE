-- P1: generic professional boundary and optional Pet Shop entities.
create or replace view public.professionals
with (security_invoker = true)
as
select id, name, avatar, specialty, active, working_hours, description,
       "order", user_id, created_at
from public.barbers;

comment on view public.professionals is 'Generic API name over the legacy barbers table during its migration window.';
grant select on public.professionals to anon, authenticated;
grant insert, update, delete on public.professionals to authenticated;

create or replace function public.capability_enabled(p_capability text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((
    select enabled from public.feature_settings where capability = p_capability
  ), false);
$$;

create table public.pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 80),
  species text not null check (length(trim(species)) between 2 and 40),
  breed text check (breed is null or length(trim(breed)) between 2 and 80),
  size text check (size is null or size in ('small', 'medium', 'large')),
  birth_date date check (birth_date is null or birth_date <= current_date),
  sex text check (sex is null or sex in ('female', 'male', 'unknown')),
  restrictions text check (restrictions is null or length(restrictions) <= 1000),
  behavior_notes text check (behavior_notes is null or length(behavior_notes) <= 1000),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pet_notes (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  note text not null check (length(trim(note)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table public.booking_pets (
  booking_id uuid primary key references public.bookings(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete restrict
);

create index pets_owner_active_idx on public.pets(owner_id, active);
create index pet_notes_pet_created_idx on public.pet_notes(pet_id, created_at desc);
create index booking_pets_pet_idx on public.booking_pets(pet_id);

alter table public.pets enable row level security;
alter table public.pet_notes enable row level security;
alter table public.booking_pets enable row level security;

create policy pets_owner_or_admin_read on public.pets for select
using (owner_id = auth.uid() or public.auth_role() = 'admin');
create policy pets_owner_or_admin_insert on public.pets for insert
with check (
  public.capability_enabled('pets')
  and (owner_id = auth.uid() or public.auth_role() = 'admin')
);
create policy pets_owner_or_admin_update on public.pets for update
using (owner_id = auth.uid() or public.auth_role() = 'admin')
with check (
  public.capability_enabled('pets')
  and (owner_id = auth.uid() or public.auth_role() = 'admin')
);
create policy pets_admin_delete on public.pets for delete
using (public.auth_role() = 'admin');

create policy pet_notes_related_read on public.pet_notes for select
using (
  public.auth_role() = 'admin'
  or exists (select 1 from public.pets p where p.id = pet_id and p.owner_id = auth.uid())
  or exists (
    select 1 from public.booking_pets bp
    join public.bookings b on b.id = bp.booking_id
    where bp.pet_id = pet_id
      and public.auth_role() = 'barber'
      and b.barber_id = (select profile_id from public.profiles where id = auth.uid())
  )
);
create policy pet_notes_staff_write on public.pet_notes for insert
with check (
  public.capability_enabled('pets')
  and author_id = auth.uid()
  and public.auth_role() in ('admin', 'barber')
);
create policy pet_notes_admin_change on public.pet_notes for update
using (public.auth_role() = 'admin') with check (public.auth_role() = 'admin');
create policy pet_notes_admin_delete on public.pet_notes for delete
using (public.auth_role() = 'admin');

create policy booking_pets_related_read on public.booking_pets for select
using (exists (select 1 from public.bookings b where b.id = booking_id));
create policy booking_pets_admin_write on public.booking_pets for all
using (public.auth_role() = 'admin')
with check (public.auth_role() = 'admin' and public.capability_enabled('pets'));

grant select, insert, update, delete on public.pets to authenticated;
grant select, insert, update, delete on public.pet_notes to authenticated;
grant select, insert, update, delete on public.booking_pets to authenticated;
revoke all on function public.capability_enabled(text) from public;
grant execute on function public.capability_enabled(text) to anon, authenticated;
