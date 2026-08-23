-- End-to-end authorization and historical booking integrity checks.
begin;

insert into auth.users(id, email, email_confirmed_at, raw_user_meta_data)
values
  ('00000000-0000-4000-8000-000000000001', 'owner@example.test', now(), '{"name":"Owner"}'),
  ('00000000-0000-4000-8000-000000000002', 'customer@example.test', now(), '{"name":"Customer","privacy_policy_version":"2026-08-23"}');

select set_config('core.test.setup_code', public.prepare_installation_owner('owner@example.test'), true);
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);

do $$
begin
  begin
    perform public.claim_first_owner(current_setting('core.test.setup_code'));
    raise exception 'TEST FAILURE: another account claimed the installation';
  exception when insufficient_privilege then
    null;
  end;

  if not exists (
    select 1 from public.profiles
    where id = '00000000-0000-4000-8000-000000000002'
      and privacy_accepted_at is not null
      and privacy_policy_version = '2026-08-23'
  ) then
    raise exception 'TEST FAILURE: privacy consent was not recorded by the server';
  end if;

  if has_function_privilege('anon', 'public.prepare_installation_owner(text)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.prepare_installation_owner(text)', 'EXECUTE')
     or has_table_privilege('anon', 'public.installation_bootstrap', 'SELECT')
     or has_table_privilege('authenticated', 'public.installation_bootstrap', 'SELECT') then
    raise exception 'TEST FAILURE: bootstrap secrets are accessible to browser roles';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);
select public.claim_first_owner(current_setting('core.test.setup_code'));

update public.barbershop_config
set booking_window_days = 30,
    working_hours = '{"open":"08:00","close":"19:00","daysOpen":[0,1,2,3,4,5,6]}'::jsonb;

insert into public.barbers(id, name, specialty)
values ('00000000-0000-4000-8000-000000000003', 'Profissional teste', 'Agenda');

insert into public.services(id, name, duration, price)
values ('00000000-0000-4000-8000-000000000004', 'Serviço teste', 60, 50);

insert into public.schedule_blocks(barber_id, type, date, start_time, end_time, reason)
values (
  '00000000-0000-4000-8000-000000000003',
  'block',
  (now() at time zone 'America/Sao_Paulo')::date + 2,
  '17:00',
  '18:00',
  'Informação interna confidencial'
);

insert into auth.sessions(user_id)
values ('00000000-0000-4000-8000-000000000002');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);

select public.create_booking(
  '00000000-0000-4000-8000-000000000002',
  'Cliente teste',
  '85999999991',
  '00000000-0000-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000004',
  (now() at time zone 'America/Sao_Paulo')::date + 2,
  '10:00',
  null,
  1
);

set local role anon;
select set_config('request.jwt.claim.sub', '', true);

select public.create_booking(
  null,
  'Convidado teste',
  '85999999992',
  '00000000-0000-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000004',
  (now() at time zone 'America/Sao_Paulo')::date + 2,
  '12:00',
  null,
  1
);

do $$
declare
  v_booking_id uuid;
  v_public_block jsonb;
begin
  if exists(select 1 from public.bookings)
     or exists(select 1 from public.schedule_blocks) then
    raise exception 'TEST FAILURE: anonymous callers can read private rows';
  end if;

  if (select count(*) from public.get_public_occupied_intervals(
    '00000000-0000-4000-8000-000000000003',
    (now() at time zone 'America/Sao_Paulo')::date + 2
  )) <> 2 then
    raise exception 'TEST FAILURE: public availability omitted occupied times';
  end if;

  select to_jsonb(block) into v_public_block
  from public.get_public_schedule_blocks() block;
  if v_public_block is null or v_public_block ? 'reason' then
    raise exception 'TEST FAILURE: public schedule blocks expose internal reasons';
  end if;

  v_booking_id := '00000000-0000-4000-8000-000000000009';
  begin
    perform * from public.get_public_occupied_intervals(
      '00000000-0000-4000-8000-000000000003',
      (now() at time zone 'America/Sao_Paulo')::date + 2,
      v_booking_id
    );
    raise exception 'TEST FAILURE: anonymous callers can exclude reservations';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);

update public.services
set duration = 30, price = 99
where id = '00000000-0000-4000-8000-000000000004';

update public.booking_settings
set cancellation_notice_minutes = 10_000
where id = true;

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);

do $$
declare
  v_booking public.bookings;
begin
  select * into v_booking from public.bookings where customer_id = auth.uid();

  begin
    update public.bookings
    set starts_at = starts_at + interval '30 minutes'
    where id = v_booking.id;
    raise exception 'TEST FAILURE: client altered immutable booking snapshots';
  exception when raise_exception then
    if sqlerrm not like '%controlados exclusivamente pelo servidor%' then
      raise;
    end if;
  end;

  begin
    update public.bookings set status = 'Cancelado' where id = v_booking.id;
    raise exception 'TEST FAILURE: cancellation notice was bypassed';
  exception when raise_exception then
    if sqlerrm not like '%prazo mínimo para cancelamento%' then
      raise;
    end if;
  end;

  select * into v_booking
  from public.reschedule_booking(v_booking.id, v_booking.date, '11:00');

  if v_booking.duration_minutes <> 60 or v_booking.value <> 50 then
    raise exception 'TEST FAILURE: reschedule changed historical duration or price';
  end if;

  begin
    perform public.delete_user_account('00000000-0000-4000-8000-000000000001');
    raise exception 'TEST FAILURE: customer deleted another account';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);
select public.delete_user_account('00000000-0000-4000-8000-000000000002');

reset role;

do $$
begin
  if exists(select 1 from auth.users where id = '00000000-0000-4000-8000-000000000002')
     or exists(select 1 from auth.sessions where user_id = '00000000-0000-4000-8000-000000000002')
     or exists(select 1 from public.profiles where id = '00000000-0000-4000-8000-000000000002') then
    raise exception 'TEST FAILURE: account deletion left authentication data behind';
  end if;
end;
$$;

rollback;
