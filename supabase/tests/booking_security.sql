-- End-to-end authorization and historical booking integrity checks.
begin;

insert into auth.users(id, email, email_confirmed_at, raw_user_meta_data)
values
  ('00000000-0000-4000-8000-000000000001', 'owner@example.test', now(), '{"name":"Owner"}'),
  ('00000000-0000-4000-8000-000000000002', 'customer@example.test', now(), '{"name":"Customer","phone":"(85) 99999-9991","privacy_policy_version":"2026-08-24"}'),
  ('00000000-0000-4000-8000-000000000005', 'professional@example.test', now(), '{"name":"Professional"}');

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
      and privacy_policy_version = '2026-08-24'
      and phone = '(85) 99999-9991'
  ) then
    raise exception 'TEST FAILURE: signup metadata was not recorded by the server';
  end if;

  if has_function_privilege('anon', 'public.prepare_installation_owner(text)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.prepare_installation_owner(text)', 'EXECUTE')
     or has_function_privilege('anon', 'public.create_admin_booking(uuid,text,text,uuid,text,date,time,text,public.booking_status,boolean)', 'EXECUTE')
     or has_function_privilege('anon', 'public.get_admin_professionals()', 'EXECUTE')
     or has_function_privilege('anon', 'public.reorder_gallery_photos(uuid[])', 'EXECUTE')
     or has_table_privilege('anon', 'public.barbers', 'SELECT')
     or has_table_privilege('authenticated', 'public.barbers', 'SELECT')
     or has_column_privilege('authenticated', 'public.barbers', 'user_id', 'SELECT')
     or not has_column_privilege('authenticated', 'public.barbers', 'id', 'SELECT')
     or has_table_privilege('anon', 'public.installation_bootstrap', 'SELECT')
     or has_table_privilege('authenticated', 'public.installation_bootstrap', 'SELECT') then
    raise exception 'TEST FAILURE: bootstrap secrets are accessible to browser roles';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);
select public.complete_business_onboarding(
  'CORE Teste',
  'barbershop',
  'minimal_light',
  '85999999990',
  'Rua de teste, 1',
  array['online_booking', 'professionals', 'services'],
  '{"open":"08:00","close":"19:00","daysOpen":[0,1,2,3,4,5,6]}'::jsonb,
  '[{"name":"Serviço inicial","duration":45,"price":79.90,"category":"Teste"}]'::jsonb,
  '[]'::jsonb,
  30,
  30,
  current_setting('core.test.setup_code')
);

do $$
begin
  if not exists (
    select 1 from public.installation_owners where user_id = '00000000-0000-4000-8000-000000000001'
  ) or not exists (
    select 1 from public.business_profile where id = true and onboarding_completed
  ) or not exists (
    select 1 from public.services where name = 'Serviço inicial' and price = 79.90
  ) then
    raise exception 'TEST FAILURE: owner claim, configuration and service prices were not committed together';
  end if;
end;
$$;

do $$
begin
  begin
    update public.business_profile set timezone = 'Mars/Olympus' where id = true;
    raise exception 'TEST FAILURE: unsupported business timezone was accepted';
  exception when check_violation then
    null;
  end;

  begin
    update public.business_profile set theme_id = 'unknown_theme' where id = true;
    raise exception 'TEST FAILURE: unsupported business theme was accepted';
  exception when check_violation then
    null;
  end;

  begin
    update public.business_profile set website = 'javascript:alert(1)' where id = true;
    raise exception 'TEST FAILURE: unsafe business URL was accepted';
  exception when check_violation then
    null;
  end;

  begin
    update public.business_profile set phone = 'telefone 85999999990' where id = true;
    raise exception 'TEST FAILURE: alphabetic business phone was accepted';
  exception when check_violation then
    null;
  end;

  begin
    insert into public.feature_settings(capability, enabled) values ('root_access', true);
    raise exception 'TEST FAILURE: unsupported capability was accepted';
  exception when check_violation then
    null;
  end;
end;
$$;

insert into public.pets(id, owner_id, name, species, updated_at)
values (
  '00000000-0000-4000-8000-000000000008',
  '00000000-0000-4000-8000-000000000002',
  'Pet teste',
  'Canino',
  now() - interval '1 day'
);

update public.pets
set name = 'Pet teste atualizado'
where id = '00000000-0000-4000-8000-000000000008';

do $$
begin
  if not exists (
    select 1 from public.pets
    where id = '00000000-0000-4000-8000-000000000008'
      and updated_at > now() - interval '1 minute'
  ) then
    raise exception 'TEST FAILURE: pet updates do not refresh updated_at';
  end if;
end;
$$;

update public.barbershop_config
set booking_window_days = 30,
    working_hours = '{"open":"08:00","close":"19:00","daysOpen":[0,1,2,3,4,5,6]}'::jsonb;

do $$
begin
  begin
    update public.barbershop_config
    set working_hours = '{"open":"18:00","close":"09:00","daysOpen":[1]}'::jsonb;
    raise exception 'TEST FAILURE: invalid business hours were accepted';
  exception when check_violation then
    null;
  end;

  begin
    update public.barbershop_config
    set social_links = '{"instagram":"javascript:alert(1)"}'::jsonb;
    raise exception 'TEST FAILURE: unsafe public social link was accepted';
  exception when check_violation then
    null;
  end;

  begin
    update public.barbershop_config
    set booking_fee = 10, pix_key = null;
    raise exception 'TEST FAILURE: booking fee without a PIX key was accepted';
  exception when check_violation then
    null;
  end;

  begin
    update public.barbershop_config
    set phone = 'telefone 85999999990';
    raise exception 'TEST FAILURE: invalid business phone was accepted';
  exception when check_violation then
    null;
  end;
end;
$$;

update public.profiles
set role = 'professional'
where id = '00000000-0000-4000-8000-000000000005';

insert into public.barbers(id, name, specialty, user_id)
values (
  '00000000-0000-4000-8000-000000000003', 'Profissional teste', 'Agenda',
  '00000000-0000-4000-8000-000000000005'
);

-- The professional may work a broader personal schedule, but the business
-- schedule must remain the outer boundary for public bookings.
update public.barbers
set working_hours = '{"open":"06:00","close":"22:00","daysOpen":[0,1,2,3,4,5,6]}'::jsonb
where id = '00000000-0000-4000-8000-000000000003';

insert into public.barbers(id, name, active)
values ('00000000-0000-4000-8000-000000000010', 'Profissional inativo', false);

do $$
begin
  if not exists (
    select 1 from public.profiles
    where id = '00000000-0000-4000-8000-000000000005'
      and profile_id = '00000000-0000-4000-8000-000000000003'
  ) then
    raise exception 'TEST FAILURE: professional link was not synchronized atomically';
  end if;

  begin
    update public.profiles
    set profile_id = null
    where id = '00000000-0000-4000-8000-000000000005';
    raise exception 'TEST FAILURE: one-sided professional unlink was accepted';
  exception when check_violation then
    null;
  end;
end;
$$;

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

insert into public.schedule_blocks(id, barber_id, type, date, reason)
values (
  '00000000-0000-4000-8000-000000000011',
  'all', 'offday',
  (now() at time zone 'America/Sao_Paulo')::date - 30,
  'Bloqueio histórico'
);

do $$
begin
  begin
    insert into public.schedule_blocks(barber_id, type, date, start_time, end_time, reason)
    values ('00000000-0000-4000-8000-000000000003', 'block', current_date + 1, '10:00', '09:00', 'Inválido');
    raise exception 'TEST FAILURE: invalid timed block was accepted';
  exception when check_violation then
    null;
  end;

  begin
    insert into public.schedule_blocks(barber_id, type, start_date, end_date, reason)
    values ('all', 'vacation', current_date + 2, current_date + 1, 'Inválido');
    raise exception 'TEST FAILURE: reversed absence range was accepted';
  exception when check_violation then
    null;
  end;
end;
$$;

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
begin
  begin
    perform public.create_booking(
      null, 'Fora do expediente', '85999999993',
      '00000000-0000-4000-8000-000000000003',
      '00000000-0000-4000-8000-000000000004',
      (now() at time zone 'America/Sao_Paulo')::date + 3,
      '07:00', null, 1
    );
    raise exception 'TEST FAILURE: professional hours escaped the business schedule';
  exception when raise_exception then
    if sqlerrm not like '%fora do expediente%' then raise; end if;
  end;

  begin
    perform public.create_booking(
      null, 'Fora da grade', '85999999994',
      '00000000-0000-4000-8000-000000000003',
      '00000000-0000-4000-8000-000000000004',
      (now() at time zone 'America/Sao_Paulo')::date + 3,
      '12:07', null, 1
    );
    raise exception 'TEST FAILURE: off-grid booking time was accepted';
  exception when raise_exception then
    if sqlerrm not like '%fora da grade%' then raise; end if;
  end;
end;
$$;

do $$
declare
  v_booking_id uuid;
  v_public_block jsonb;
  v_public_professional jsonb;
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

  select to_jsonb(professional) into v_public_professional
  from public.get_public_professionals() professional limit 1;
  if v_public_professional is null or v_public_professional ? 'user_id'
     or exists (select 1 from public.get_public_professionals() where not active) then
    raise exception 'TEST FAILURE: public professional catalog exposes account links';
  end if;

  if exists (
    select 1 from public.get_public_schedule_blocks()
    where id = '00000000-0000-4000-8000-000000000011'
  ) then
    raise exception 'TEST FAILURE: public schedule projection exposes expired history';
  end if;

  begin
    perform * from public.get_admin_professionals();
    raise exception 'TEST FAILURE: anonymous caller read professional account links';
  exception when insufficient_privilege then
    null;
  end;

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

update public.barbershop_config
set minimum_notice_minutes = 45,
    cancellation_notice_minutes = 120
where id = true;

do $$
begin
  if not exists (
    select 1 from public.booking_settings
    where id = true
      and minimum_notice_minutes = 45
      and cancellation_notice_minutes = 120
  ) then
    raise exception 'TEST FAILURE: booking notice settings were not synchronized';
  end if;
end;
$$;

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
    perform public.create_admin_booking(
      null, 'Walk-in indevido', '85999999993',
      '00000000-0000-4000-8000-000000000003',
      '00000000-0000-4000-8000-000000000004',
      v_booking.date + 1, '14:00', null, 'Confirmado', true
    );
    raise exception 'TEST FAILURE: customer created an administrative booking';
  exception when insufficient_privilege then
    null;
  end;

  begin
    perform public.reorder_gallery_photos(array[]::uuid[]);
    raise exception 'TEST FAILURE: customer reordered the gallery';
  exception when insufficient_privilege then
    null;
  end;

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
    update public.bookings
    set notes = 'Observação adulterada pelo cliente'
    where id = v_booking.id;
    raise exception 'TEST FAILURE: customer altered booking notes';
  exception when raise_exception then
    if sqlerrm not like '%clientes só podem cancelar%' then raise; end if;
  end;

  update public.bookings
  set customer_confirmed = true
  where id = v_booking.id;

  begin
    update public.bookings
    set customer_confirmed = false
    where id = v_booking.id;
    raise exception 'TEST FAILURE: customer reverted attendance confirmation';
  exception when raise_exception then
    if sqlerrm not like '%presença só pode ser confirmada uma vez%' then raise; end if;
  end;

  begin
    update public.bookings set status = 'Cancelado' where id = v_booking.id;
    raise exception 'TEST FAILURE: cancellation notice was bypassed';
  exception when raise_exception then
    if sqlerrm not like '%prazo mínimo para cancelamento%' then
      raise;
    end if;
  end;

  begin
    update public.profiles
    set email = 'divergente@example.test'
    where id = auth.uid();
    raise exception 'TEST FAILURE: customer diverged profile email from Auth';
  exception when raise_exception then
    if sqlerrm not like '%fluxo de autenticação%' then raise; end if;
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

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000005', true);

do $$
declare
  v_booking_id uuid;
begin
  select id into v_booking_id
  from public.bookings
  where barber_id = '00000000-0000-4000-8000-000000000003'
  order by created_at
  limit 1;

  begin
    update public.bookings
    set customer_name = 'Identidade adulterada'
    where id = v_booking_id;
    raise exception 'TEST FAILURE: professional altered customer identity';
  exception when raise_exception then
    if sqlerrm not like '%Profissionais só podem atualizar%' then raise; end if;
  end;

  begin
    update public.bookings
    set status = 'Não compareceu'
    where id = v_booking_id;
    raise exception 'TEST FAILURE: professional registered a no-show before the appointment';
  exception when raise_exception then
    if sqlerrm not like '%antes do início do horário%' then raise; end if;
  end;

  update public.bookings
  set status = 'Confirmado', fee_paid = true
  where id = v_booking_id;

  begin
    update public.bookings
    set status = 'Concluído'
    where id = v_booking_id;
    raise exception 'TEST FAILURE: professional skipped the in-service state';
  exception when raise_exception then
    if sqlerrm not like '%Transição de status inválida%' then raise; end if;
  end;

  update public.bookings
  set status = 'Em atendimento'
  where id = v_booking_id;

  update public.bookings
  set status = 'Concluído'
  where id = v_booking_id;
end;
$$;

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);

do $$
declare
  v_booking public.bookings;
begin
  select * into v_booking from public.create_admin_booking(
    null, 'Walk-in administrativo', '85999999993',
    '00000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000000004',
    (now() at time zone 'America/Sao_Paulo')::date + 3,
    '14:00', 'Criado pela recepção', 'Concluído', false
  );

  if v_booking.status <> 'Concluído' or v_booking.fee_paid or v_booking.value <> 99 then
    raise exception 'TEST FAILURE: administrative status/payment/server price choices were ignored';
  end if;

  begin
    perform public.reschedule_booking(v_booking.id, v_booking.date + 1, '14:00');
    raise exception 'TEST FAILURE: finalized booking was rescheduled';
  exception when raise_exception then
    if sqlerrm not like '%agendamento finalizado%' then raise; end if;
  end;

  insert into public.gallery_photos(id, image_url, display_order)
  values
    ('00000000-0000-4000-8000-000000000006', 'https://example.test/first.webp', 0),
    ('00000000-0000-4000-8000-000000000007', 'https://example.test/second.webp', 1);

  perform public.reorder_gallery_photos(array[
    '00000000-0000-4000-8000-000000000007'::uuid,
    '00000000-0000-4000-8000-000000000006'::uuid
  ]);

  if not exists (
    select 1 from public.gallery_photos
    where id = '00000000-0000-4000-8000-000000000007' and display_order = 0 and "order" = 0
  ) then
    raise exception 'TEST FAILURE: gallery reorder was not persisted atomically';
  end if;
end;
$$;

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
