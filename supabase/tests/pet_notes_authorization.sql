-- Regression test for pet-note RLS isolation.
-- Run after supabase/schema.sql and data_api_grants.sql in a disposable database.
begin;

insert into auth.users(id, email, email_confirmed_at, raw_user_meta_data)
values
  ('10000000-0000-4000-8000-000000000001', 'pet-owner@example.test', now(), '{"name":"Pet Owner"}'),
  ('10000000-0000-4000-8000-000000000002', 'pet-professional@example.test', now(), '{"name":"Pet Professional"}');

update public.profiles
set role = 'professional'
where id = '10000000-0000-4000-8000-000000000002';

insert into public.barbers(id, name, specialty, user_id)
values (
  '10000000-0000-4000-8000-000000000003',
  'Profissional Pet',
  'Cuidados pet',
  '10000000-0000-4000-8000-000000000002'
);

insert into public.pets(id, owner_id, name, species)
values
  (
    '10000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000001',
    'Pet atendido',
    'Canino'
  ),
  (
    '10000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000001',
    'Pet não relacionado',
    'Felino'
  );

insert into public.bookings(
  id, customer_id, customer_name, customer_phone, barber_id, service_id,
  date, time, status, value, starts_at, ends_at, duration_minutes
)
values (
  '10000000-0000-4000-8000-000000000006',
  null,
  'Cliente Pet',
  '85999999999',
  '10000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000007',
  current_date + 30,
  '10:00',
  'Confirmado',
  50,
  (current_date + 30 + time '10:00') at time zone 'America/Sao_Paulo',
  (current_date + 30 + time '11:00') at time zone 'America/Sao_Paulo',
  60
);

insert into public.booking_pets(booking_id, pet_id)
values (
  '10000000-0000-4000-8000-000000000006',
  '10000000-0000-4000-8000-000000000004'
);

insert into public.pet_notes(id, pet_id, author_id, note)
values
  (
    '10000000-0000-4000-8000-000000000008',
    '10000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000002',
    'Nota do pet realmente atendido'
  ),
  (
    '10000000-0000-4000-8000-000000000009',
    '10000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000002',
    'Nota confidencial de outro pet'
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);

do $$
begin
  if not exists (
    select 1
    from public.pet_notes
    where id = '10000000-0000-4000-8000-000000000008'
  ) then
    raise exception 'TEST FAILURE: professional cannot read notes for the pet linked to their booking';
  end if;

  if exists (
    select 1
    from public.pet_notes
    where id = '10000000-0000-4000-8000-000000000009'
  ) then
    raise exception 'TEST FAILURE: professional can read notes for an unrelated pet';
  end if;

  if (select count(*) from public.pet_notes) <> 1 then
    raise exception 'TEST FAILURE: professional pet-note visibility is broader or narrower than expected';
  end if;
end;
$$;

rollback;
