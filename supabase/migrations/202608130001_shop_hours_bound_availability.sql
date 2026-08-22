-- Keep every professional and special schedule inside the barbershop opening window.

create or replace function public.validate_booking_business_rules()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_role user_role;
  v_digits text;
  v_local_digits text;
  v_service_count int;
  v_duration int;
  v_price numeric(10,2);
  v_interval int;
  v_booking_window_days int;
  v_hours jsonb;
  v_shop_hours jsonb;
  v_barber_hours jsonb;
  v_shop_special_hours jsonb;
  v_barber_special_hours jsonb;
  v_barber_active boolean;
  v_start_mins int;
  v_end_mins int;
  v_open_mins int;
  v_close_mins int;
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_now_mins int := extract(hour from (now() at time zone 'America/Sao_Paulo')) * 60
                    + extract(minute from (now() at time zone 'America/Sao_Paulo'));
  v_weekday int;
  v_pending_count int;
  v_recent_count int;
begin
  if tg_op = 'UPDATE'
     and new.customer_name is not distinct from old.customer_name
     and new.customer_phone is not distinct from old.customer_phone
     and new.barber_id is not distinct from old.barber_id
     and new.service_id is not distinct from old.service_id
     and new.date is not distinct from old.date
     and new.time is not distinct from old.time
     and new.notes is not distinct from old.notes
     and new.value is not distinct from old.value then
    return new;
  end if;

  v_actor_role := auth_role();
  new.customer_name := btrim(new.customer_name);
  new.customer_phone := btrim(new.customer_phone);
  new.notes := nullif(btrim(new.notes), '');

  if char_length(new.customer_name) < 2 or char_length(new.customer_name) > 100 then
    raise exception 'Nome do cliente inválido.';
  end if;
  if new.notes is not null and char_length(new.notes) > 1000 then
    raise exception 'Observações excedem o limite de 1000 caracteres.';
  end if;

  v_digits := regexp_replace(new.customer_phone, '\D', '', 'g');
  v_local_digits := case when char_length(v_digits) in (12, 13) and left(v_digits, 2) = '55'
                         then substr(v_digits, 3) else v_digits end;
  if char_length(v_local_digits) not in (10, 11) then
    raise exception 'Telefone inválido. Informe DDD e número.';
  end if;

  -- `auth_role() <> 'admin'` resulta em NULL para visitantes anônimos nas
  -- versões anteriores da RPC e, em PL/pgSQL, o IF não era executado. Use
  -- IS DISTINCT FROM para que o rate limit cubra convidados de verdade.
  if tg_op = 'INSERT' and v_actor_role is distinct from 'admin' then
    -- O lock por telefone deve vir antes das contagens e permanecer até o fim
    -- da transação. Assim, inserts concorrentes para barbeiros/datas diferentes
    -- não observam a mesma contagem antes de gravarem seus agendamentos.
    perform pg_advisory_xact_lock(
      hashtextextended('booking-rate-limit:' || v_local_digits, 0)
    );

    select count(*) into v_pending_count from bookings
    where (case
      when left(regexp_replace(customer_phone, '\D', '', 'g'), 2) = '55'
        and char_length(regexp_replace(customer_phone, '\D', '', 'g')) in (12, 13)
      then substr(regexp_replace(customer_phone, '\D', '', 'g'), 3)
      else regexp_replace(customer_phone, '\D', '', 'g') end) = v_local_digits
      and status = 'Aguardando pagamento' and date >= v_today;
    if v_pending_count >= 3 then
      raise exception 'Limite de agendamentos aguardando pagamento atingido.';
    end if;

    select count(*) into v_recent_count from bookings
    where (case
      when left(regexp_replace(customer_phone, '\D', '', 'g'), 2) = '55'
        and char_length(regexp_replace(customer_phone, '\D', '', 'g')) in (12, 13)
      then substr(regexp_replace(customer_phone, '\D', '', 'g'), 3)
      else regexp_replace(customer_phone, '\D', '', 'g') end) = v_local_digits
      and created_at >= now() - interval '24 hours';
    if v_recent_count >= 5 then
      raise exception 'Limite de agendamentos nas últimas 24 horas atingido.';
    end if;
  end if;

  select count(*), coalesce(sum(duration), 0), coalesce(sum(price), 0)
    into v_service_count, v_duration, v_price
  from services
  where active = true
    and id::text = any(string_to_array(new.service_id, ','));

  if v_service_count = 0
     or v_service_count <> cardinality(string_to_array(new.service_id, ',')) then
    raise exception 'Um ou mais serviços são inválidos ou estão inativos.';
  end if;
  -- O preço exibido pelo navegador nunca é fonte de verdade.
  new.value := v_price;

  select b.active, coalesce(b.working_hours, c.working_hours), c.working_hours, c.interval_minutes, c.booking_window_days
    into v_barber_active, v_barber_hours, v_shop_hours, v_interval, v_booking_window_days
  from barbers b cross join barbershop_config c
  where b.id = new.barber_id and c.id = true;

  if not found or not v_barber_active then
    raise exception 'Profissional inválido ou indisponível.';
  end if;

  if v_actor_role is distinct from 'admin' then
    if new.date < v_today or new.date > v_today + (v_booking_window_days - 1) then
      raise exception 'A data deve estar dentro da janela pública de agendamento.';
    end if;
    v_start_mins := extract(hour from new.time) * 60 + extract(minute from new.time);
    if new.date = v_today and v_start_mins <= v_now_mins + 30 then
      raise exception 'O horário deve ter pelo menos 30 minutos de antecedência.';
    end if;
  else
    v_start_mins := extract(hour from new.time) * 60 + extract(minute from new.time);
  end if;

  v_weekday := extract(dow from new.date);

  -- Resolve the shop's regular weekday first. A salon-wide special schedule
  -- may replace it, while an individual special schedule can only narrow it.
  select sb.special_hours into v_shop_special_hours
  from schedule_blocks sb
  where sb.type = 'special' and sb.special_hours is not null
    and sb.date = new.date and sb.barber_id = 'all'
  limit 1;

  if v_shop_special_hours is not null then
    v_shop_hours := v_shop_special_hours;
  elsif v_shop_hours->'weeklySchedule'->(v_weekday::text) is not null then
    if coalesce(
      (v_shop_hours->'weeklySchedule'->(v_weekday::text)->>'closed')::boolean,
      not exists (select 1 from jsonb_array_elements_text(coalesce(v_shop_hours->'daysOpen', '[]'::jsonb)) d where d::int = v_weekday)
    ) then
      raise exception 'A barbearia está fechada nesta data.';
    end if;
    v_shop_hours := v_shop_hours || (v_shop_hours->'weeklySchedule'->(v_weekday::text));
  elsif not exists (select 1 from jsonb_array_elements_text(coalesce(v_shop_hours->'daysOpen', '[]'::jsonb)) d where d::int = v_weekday) then
    raise exception 'A barbearia está fechada nesta data.';
  end if;

  select sb.special_hours into v_barber_special_hours
  from schedule_blocks sb
  where sb.type = 'special' and sb.special_hours is not null
    and sb.date = new.date and sb.barber_id = new.barber_id::text
  limit 1;

  if v_barber_special_hours is not null then
    v_barber_hours := v_barber_special_hours;
  elsif v_barber_hours->'weeklySchedule'->(v_weekday::text) is not null then
    if coalesce(
      (v_barber_hours->'weeklySchedule'->(v_weekday::text)->>'closed')::boolean,
      not exists (select 1 from jsonb_array_elements_text(coalesce(v_barber_hours->'daysOpen', '[]'::jsonb)) d where d::int = v_weekday)
    ) then
      raise exception 'O profissional não trabalha nesta data.';
    end if;
    v_barber_hours := v_barber_hours || (v_barber_hours->'weeklySchedule'->(v_weekday::text));
  elsif not exists (select 1 from jsonb_array_elements_text(coalesce(v_barber_hours->'daysOpen', '[]'::jsonb)) d where d::int = v_weekday) then
    raise exception 'O profissional não trabalha nesta data.';
  end if;

  -- Intersection: the professional may reduce their availability, never
  -- extend the barbershop's opening and closing hours.
  v_hours := v_barber_hours;
  v_open_mins := greatest(
    split_part(v_shop_hours->>'open', ':', 1)::int * 60 + split_part(v_shop_hours->>'open', ':', 2)::int,
    split_part(v_barber_hours->>'open', ':', 1)::int * 60 + split_part(v_barber_hours->>'open', ':', 2)::int
  );
  v_close_mins := least(
    split_part(v_shop_hours->>'close', ':', 1)::int * 60 + split_part(v_shop_hours->>'close', ':', 2)::int,
    split_part(v_barber_hours->>'close', ':', 1)::int * 60 + split_part(v_barber_hours->>'close', ':', 2)::int
  );
  v_end_mins := v_start_mins + v_duration + coalesce(v_interval, 0);
  if v_start_mins < v_open_mins or v_end_mins > v_close_mins then
    raise exception 'Horário fora do expediente do profissional.';
  end if;

  if (v_barber_hours->>'breakStart' is not null and v_barber_hours->>'breakEnd' is not null
       and (split_part(v_barber_hours->>'breakStart', ':', 1)::int * 60 + split_part(v_barber_hours->>'breakStart', ':', 2)::int) < v_end_mins
       and (split_part(v_barber_hours->>'breakEnd', ':', 1)::int * 60 + split_part(v_barber_hours->>'breakEnd', ':', 2)::int) > v_start_mins)
     or (v_shop_hours->>'breakStart' is not null and v_shop_hours->>'breakEnd' is not null
       and (split_part(v_shop_hours->>'breakStart', ':', 1)::int * 60 + split_part(v_shop_hours->>'breakStart', ':', 2)::int) < v_end_mins
       and (split_part(v_shop_hours->>'breakEnd', ':', 1)::int * 60 + split_part(v_shop_hours->>'breakEnd', ':', 2)::int) > v_start_mins) then
    raise exception 'Horário coincide com um intervalo indisponível.';
  end if;

  return new;
end;
$$;

