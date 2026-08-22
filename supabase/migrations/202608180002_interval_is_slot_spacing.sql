-- Treat interval_minutes as the spacing of the appointment grid, not as
-- cleanup time appended to every service. A 30-minute service at 09:00 must
-- therefore leave 09:30 available when the configured grid is 30 minutes.
-- Keep UI availability, RPC validation, and direct-write protection aligned.

create or replace function validate_booking_business_rules()
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
  v_booking_window_days int;
  v_hours jsonb;
  v_special_hours jsonb;
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

  select b.active, coalesce(b.working_hours, c.working_hours), c.booking_window_days
    into v_barber_active, v_hours, v_booking_window_days
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

  select sb.special_hours into v_special_hours
  from schedule_blocks sb
  where sb.type = 'special' and sb.special_hours is not null
    and sb.date = new.date
    and (sb.barber_id = 'all' or sb.barber_id = new.barber_id::text)
  order by case when sb.barber_id = new.barber_id::text then 0 else 1 end
  limit 1;

  if v_special_hours is not null then
    v_hours := v_special_hours;
  else
    v_weekday := extract(dow from new.date);

    -- weeklySchedule usa as chaves JSON "0" a "6". Configurações
    -- anteriores possuem apenas daysOpen/open/close, por isso mantemos o
    -- fallback legado. Quando existe uma entrada diária, ela define tanto o
    -- estado aberto/fechado quanto os horários daquele dia.
    if v_hours->'weeklySchedule'->(v_weekday::text) is not null then
      if coalesce(
        (v_hours->'weeklySchedule'->(v_weekday::text)->>'closed')::boolean,
        not exists (
          select 1 from jsonb_array_elements_text(coalesce(v_hours->'daysOpen', '[]'::jsonb)) d
          where d::int = v_weekday
        )
      ) then
        raise exception 'O profissional não trabalha nesta data.';
      end if;
      v_hours := v_hours || (v_hours->'weeklySchedule'->(v_weekday::text));
    elsif not exists (
      select 1 from jsonb_array_elements_text(coalesce(v_hours->'daysOpen', '[]'::jsonb)) d
      where d::int = v_weekday
    ) then
      raise exception 'O profissional não trabalha nesta data.';
    end if;
  end if;

  v_open_mins := split_part(v_hours->>'open', ':', 1)::int * 60
                 + split_part(v_hours->>'open', ':', 2)::int;
  v_close_mins := split_part(v_hours->>'close', ':', 1)::int * 60
                  + split_part(v_hours->>'close', ':', 2)::int;
  v_end_mins := v_start_mins + v_duration;
  if v_start_mins < v_open_mins or v_end_mins > v_close_mins then
    raise exception 'Horário fora do expediente do profissional.';
  end if;

  if v_hours->>'breakStart' is not null and v_hours->>'breakEnd' is not null
     and (split_part(v_hours->>'breakStart', ':', 1)::int * 60
          + split_part(v_hours->>'breakStart', ':', 2)::int) < v_end_mins
     and (split_part(v_hours->>'breakEnd', ':', 1)::int * 60
          + split_part(v_hours->>'breakEnd', ':', 2)::int) > v_start_mins then
    raise exception 'Horário coincide com o intervalo do profissional.';
  end if;

  return new;
end;
$$;

-- Last line of defence against overlapping appointments. The RPCs also do
-- an early conflict check for a friendlier failure, but this trigger covers
-- direct writes using the service duration as the occupied interval.
create or replace function prevent_booking_schedule_conflicts()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_duration int;
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
  -- Invalid services are rejected by validate_booking_business_rules.
  if v_duration <= 0 then return new; end if;

  v_start_mins := extract(hour from new.time) * 60 + extract(minute from new.time);
  v_end_mins := v_start_mins + v_duration;

  if exists (
    select 1 from bookings b
    where b.barber_id = new.barber_id
      and b.date = new.date
      and b.id is distinct from new.id
      and b.status <> 'Cancelado'
      and (extract(hour from b.time) * 60 + extract(minute from b.time)) < v_end_mins
      and (extract(hour from b.time) * 60 + extract(minute from b.time))
          + coalesce((select sum(s.duration) from services s where s.id::text = any(string_to_array(b.service_id, ','))), 30) > v_start_mins
  ) then
    raise exception 'Horário indisponível: já existe um agendamento neste intervalo.';
  end if;

  return new;
end;
$$;


-- Permite que o barbeiro edite a PRÓPRIA linha em `barbers` (tela "Meu
-- Perfil"), mas só campos de apresentação (nome, foto, especialidade,
-- descrição). Campos sensíveis (ativo, horários, ordem,
-- vínculo user_id) continuam exclusivos do admin, mesmo que a policy de
-- UPDATE (`barbers_update_own`) sozinha permitisse alterar a linha toda.
create or replace function create_booking(
  p_customer_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_barber_id uuid,
  p_service_id text, -- csv de services.id
  p_date date,
  p_time time,
  p_notes text,
  p_value numeric
) returns bookings
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_duration int;
  v_tolerance_minutes int;
  v_booking_fee numeric;
  v_initial_status booking_status;
  v_start_mins int;
  v_end_mins int;
  v_conflict_count int;
  v_pending_count int;
  v_recent_count int;
  v_new_booking bookings;
begin
  if auth_role() <> 'admin' and auth.uid() is not null and p_customer_id is distinct from auth.uid() then
    raise exception 'Não é possível criar um agendamento em nome de outro usuário.';
  end if;

  if auth_role() <> 'admin' then
    select count(*) into v_pending_count
    from bookings
    where regexp_replace(customer_phone, '\D', '', 'g') = regexp_replace(p_customer_phone, '\D', '', 'g')
      and status = 'Aguardando pagamento'
      and date >= current_date;

    if v_pending_count >= 3 then
      raise exception 'Você já tem % agendamento(s) aguardando pagamento. Finalize o pagamento ou cancele um deles antes de criar um novo.', v_pending_count;
    end if;

    select count(*) into v_recent_count
    from bookings
    where regexp_replace(customer_phone, '\D', '', 'g') = regexp_replace(p_customer_phone, '\D', '', 'g')
      and created_at >= now() - interval '24 hours';

    if v_recent_count >= 5 then
      raise exception 'Limite de agendamentos criados nas últimas 24 horas atingido. Tente novamente mais tarde ou entre em contato com a barbearia.';
    end if;
  end if;

  -- Serializa chamadas concorrentes para o mesmo barbeiro+data.
  perform pg_advisory_xact_lock(hashtextextended(p_barber_id::text || p_date::text, 0));

  select coalesce(sum(duration), 0) into v_duration
  from services
  where id::text = any(string_to_array(p_service_id, ','));

  if v_duration = 0 then
    raise exception 'Serviço inválido.';
  end if;

  select tolerance_minutes, booking_fee into v_tolerance_minutes, v_booking_fee
  from barbershop_config where id = true;

  -- Sem taxa de reserva configurada (R$0 ou nula), não há pagamento a
  -- aguardar — o agendamento nasce direto como 'Confirmado'. Antes desta
  -- correção, TODO agendamento novo começava em 'Aguardando pagamento'
  -- incondicionalmente, mesmo com a taxa zerada, e ficava preso lá para
  -- sempre (não há PIX nenhum a confirmar).
  v_initial_status := case when coalesce(v_booking_fee, 0) <= 0 then 'Confirmado' else 'Aguardando pagamento' end;

  v_start_mins := extract(hour from p_time) * 60 + extract(minute from p_time);
  v_end_mins := v_start_mins + v_duration;

  -- Conflito com outros agendamentos do mesmo barbeiro/dia (não cancelados).
  select count(*) into v_conflict_count
  from bookings b
  where b.barber_id = p_barber_id
    and b.date = p_date
    and b.status <> 'Cancelado'
    and (extract(hour from b.time) * 60 + extract(minute from b.time)) < v_end_mins
    and (
      (extract(hour from b.time) * 60 + extract(minute from b.time))
      + (select coalesce(sum(s.duration), 30) from services s where s.id::text = any(string_to_array(b.service_id, ',')))
    ) > v_start_mins;

  if v_conflict_count > 0 then
    raise exception 'Horário indisponível: já existe um agendamento neste intervalo.';
  end if;

  -- Conflito com bloqueios de agenda (folga, férias, especial, bloqueio pontual).
  select count(*) into v_conflict_count
  from schedule_blocks sb
  where (sb.barber_id = 'all' or sb.barber_id = p_barber_id::text)
    and (
      -- Dia inteiro fechado: férias, folga, ou 'special' SEM horário customizado.
      ((sb.type = 'vacation' or sb.type = 'offday' or (sb.type = 'special' and sb.special_hours is null)) and (
        (sb.date is not null and sb.date = p_date)
        or (sb.start_date is not null and sb.end_date is not null and p_date between sb.start_date and sb.end_date)
      ))
      -- 'special' COM horário customizado: bloqueia só fora da janela
      -- especial, ou dentro da pausa customizada (se houver).
      or (sb.type = 'special' and sb.special_hours is not null and sb.date = p_date and (
        v_start_mins < (extract(hour from (sb.special_hours->>'open')::time) * 60 + extract(minute from (sb.special_hours->>'open')::time))
        or v_end_mins > (extract(hour from (sb.special_hours->>'close')::time) * 60 + extract(minute from (sb.special_hours->>'close')::time))
        or (
          sb.special_hours->>'breakStart' is not null and sb.special_hours->>'breakEnd' is not null
          and (extract(hour from (sb.special_hours->>'breakStart')::time) * 60 + extract(minute from (sb.special_hours->>'breakStart')::time)) < v_end_mins
          and (extract(hour from (sb.special_hours->>'breakEnd')::time) * 60 + extract(minute from (sb.special_hours->>'breakEnd')::time)) > v_start_mins
        )
      ))
      or (sb.type = 'block' and sb.date = p_date
        and (extract(hour from coalesce(sb.start_time, '00:00'::time)) * 60 + extract(minute from coalesce(sb.start_time, '00:00'::time))) < v_end_mins
        and (extract(hour from coalesce(sb.end_time, '23:59'::time)) * 60 + extract(minute from coalesce(sb.end_time, '23:59'::time))) > v_start_mins
      )
    );

  if v_conflict_count > 0 then
    raise exception 'Horário indisponível: bloqueio de agenda neste intervalo.';
  end if;

  insert into bookings (
    customer_id, customer_name, customer_phone, barber_id, service_id,
    date, time, status, notes, fee_paid, value
  ) values (
    p_customer_id, p_customer_name, p_customer_phone, p_barber_id, p_service_id,
    p_date, p_time, v_initial_status, p_notes, (v_initial_status = 'Confirmado'), p_value
  )
  returning * into v_new_booking;

  return v_new_booking;
end;
$$;

-- Reagenda um agendamento existente com a mesma trava/revalidação de
-- conflito do `create_booking` (elimina a condição de corrida do
-- reagendamento direto, que era um UPDATE sem nenhuma revalidação
-- server-side). Autorização: o próprio cliente dono do agendamento, o
-- barbeiro da agenda, ou admin.
create or replace function reschedule_booking(
  p_booking_id uuid,
  p_new_date date,
  p_new_time time
) returns bookings
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_booking bookings;
  v_duration int;
  v_start_mins int;
  v_end_mins int;
  v_conflict_count int;
  v_actor_role user_role;
begin
  select * into v_booking from bookings where id = p_booking_id;
  if not found then
    raise exception 'Agendamento não encontrado.';
  end if;

  v_actor_role := auth_role();

  if not (
    auth.uid() = v_booking.customer_id
    or v_actor_role = 'admin'
    or (v_actor_role = 'barber' and v_booking.barber_id = (select profile_id from profiles where id = auth.uid()))
  ) then
    raise exception 'Você não tem permissão para reagendar este agendamento.';
  end if;

  if v_booking.status = 'Cancelado' then
    raise exception 'Não é possível reagendar um agendamento cancelado.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_booking.barber_id::text || p_new_date::text, 0));

  select coalesce(sum(duration), 0) into v_duration
  from services
  where id::text = any(string_to_array(v_booking.service_id, ','));

  if v_duration = 0 then
    v_duration := 30;
  end if;

  v_start_mins := extract(hour from p_new_time) * 60 + extract(minute from p_new_time);
  v_end_mins := v_start_mins + v_duration;

  select count(*) into v_conflict_count
  from bookings b
  where b.barber_id = v_booking.barber_id
    and b.date = p_new_date
    and b.id <> p_booking_id
    and b.status <> 'Cancelado'
    and (extract(hour from b.time) * 60 + extract(minute from b.time)) < v_end_mins
    and (
      (extract(hour from b.time) * 60 + extract(minute from b.time))
      + (select coalesce(sum(s.duration), 30) from services s where s.id::text = any(string_to_array(b.service_id, ',')))
    ) > v_start_mins;

  if v_conflict_count > 0 then
    raise exception 'Horário indisponível: já existe um agendamento neste intervalo.';
  end if;

  select count(*) into v_conflict_count
  from schedule_blocks sb
  where (sb.barber_id = 'all' or sb.barber_id = v_booking.barber_id::text)
    and (
      ((sb.type = 'vacation' or sb.type = 'offday' or (sb.type = 'special' and sb.special_hours is null)) and (
        (sb.date is not null and sb.date = p_new_date)
        or (sb.start_date is not null and sb.end_date is not null and p_new_date between sb.start_date and sb.end_date)
      ))
      or (sb.type = 'special' and sb.special_hours is not null and sb.date = p_new_date and (
        v_start_mins < (extract(hour from (sb.special_hours->>'open')::time) * 60 + extract(minute from (sb.special_hours->>'open')::time))
        or v_end_mins > (extract(hour from (sb.special_hours->>'close')::time) * 60 + extract(minute from (sb.special_hours->>'close')::time))
        or (
          sb.special_hours->>'breakStart' is not null and sb.special_hours->>'breakEnd' is not null
          and (extract(hour from (sb.special_hours->>'breakStart')::time) * 60 + extract(minute from (sb.special_hours->>'breakStart')::time)) < v_end_mins
          and (extract(hour from (sb.special_hours->>'breakEnd')::time) * 60 + extract(minute from (sb.special_hours->>'breakEnd')::time)) > v_start_mins
        )
      ))
      or (sb.type = 'block' and sb.date = p_new_date
        and (extract(hour from coalesce(sb.start_time, '00:00'::time)) * 60 + extract(minute from coalesce(sb.start_time, '00:00'::time))) < v_end_mins
        and (extract(hour from coalesce(sb.end_time, '23:59'::time)) * 60 + extract(minute from coalesce(sb.end_time, '23:59'::time))) > v_start_mins
      )
    );

  if v_conflict_count > 0 then
    raise exception 'Horário indisponível: bloqueio de agenda neste intervalo.';
  end if;

  -- Sinaliza para o trigger `bookings_protect_updates` que esta alteração
  -- de data/hora já foi revalidada aqui e pode prosseguir mesmo quando o
  -- ator for o próprio cliente. Escopo local à transação (não vaza para
  -- outras requisições).
  perform set_config('app.reschedule_in_progress', 'true', true);

  update bookings
    set date = p_new_date, time = p_new_time
    where id = p_booking_id
    returning * into v_booking;

  return v_booking;
end;
$$;
