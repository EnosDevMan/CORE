-- Run against a disposable database after applying schema and migrations.
-- A successful run ends with ROLLBACK; any missing expected error aborts.
begin;

update public.barbershop_config
set booking_window_days = 30,
    working_hours = '{"open":"08:00","close":"19:00","daysOpen":[0,1,2,3,4,5,6]}'::jsonb;

-- Exercise the definitive GiST constraint rather than the friendly pre-check.
alter table public.bookings disable trigger bookings_prevent_schedule_conflicts;

do $$
declare
  v_professional uuid := gen_random_uuid();
  v_service uuid := gen_random_uuid();
begin
  insert into public.barbers (id, name, specialty) values (v_professional, 'Profissional Teste', 'Teste');
  insert into public.services (id, name, duration, price) values (v_service, 'Serviço Teste', 60, 50);

  insert into public.bookings (
    customer_name, customer_phone, barber_id, service_id, date, time, value, status
  ) values ('Cliente A', '85999999991', v_professional, v_service::text, current_date + 10, '09:00', 50, 'Confirmado');

  begin
    insert into public.bookings (
      customer_name, customer_phone, barber_id, service_id, date, time, value, status
    ) values ('Cliente B', '85999999992', v_professional, v_service::text, current_date + 10, '09:30', 50, 'Confirmado');
    raise exception 'TEST FAILURE: overlapping booking was accepted';
  exception
    when exclusion_violation then null;
  end;

  -- Adjacent half-open ranges are valid.
  insert into public.bookings (
    customer_name, customer_phone, barber_id, service_id, date, time, value, status
  ) values ('Cliente C', '85999999993', v_professional, v_service::text, current_date + 10, '10:00', 50, 'Confirmado');
end $$;

rollback;
