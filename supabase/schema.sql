-- ============================================================================
-- Barbearia Paulo Gledson — schema.sql (consolidado)
-- ============================================================================
-- Este arquivo substitui, para um PROJETO NOVO/VAZIO, a execução em
-- sequência de:
--   0001_initial_schema.sql
--   0002_create_booking_rpc.sql
--   0003_storage_avatars.sql
--   0004_security_and_integrity_fixes.sql
--   0005_special_hours_availability.sql
--   0006_booking_rate_limit.sql
--   0007_free_booking_status_fix.sql
--   0008_gallery_photos.sql
--   0009_barber_self_profile.sql
--   0010_production_hardening.sql
--   0011_single_admin_pix_key.sql
--   0012_serialize_booking_rate_limits.sql
--
-- Não é uma concatenação: é o ESTADO FINAL depois das 12 migrations —
-- funções que foram substituídas (create_booking, reschedule_booking)
-- aparecem aqui só na versão final; policies/triggers adicionados depois
-- (ex: as de DELETE) já nascem junto com as demais da mesma tabela; e todo
-- comando que só existia para tornar uma migration incremental idempotente
-- (DROP TRIGGER IF EXISTS, DROP POLICY IF EXISTS, CREATE OR REPLACE onde já
-- havia CREATE) foi removido, por não fazer sentido numa criação do zero.
--
-- ⚠️ USO: rode este arquivo INTEIRO, uma única vez, num banco Supabase
-- VAZIO (projeto novo). Se seu projeto já rodou as 12 migrations acima,
-- NÃO rode este arquivo nele — as tabelas/tipos já existem e todo `create
-- table`/`create type` vai falhar com "already exists". Neste caso os dois
-- caminhos já levam exatamente ao mesmo estado final; use este arquivo
-- apenas como referência de schema, ou para provisionar um projeto novo.
--
-- Todas as funções `security definer` usam `set search_path = public,
-- pg_temp`, inclusive as funções anteriores à migration 0010. É uma
-- prática recomendada padrão do Postgres/Supabase (evita uma função
-- security definer resolver um objeto errado se alguém manipular o
-- search_path da sessão) e o próprio Supabase Advisor sinaliza sua
-- ausência como aviso de segurança ("Function Search Path Mutable"). Não
-- muda nenhum comportamento das funções — todas já referenciam tabelas
-- públicas ou schemas totalmente qualificados (auth.*, storage.*).
-- ============================================================================

-- Executa o provisionamento de forma atômica e fixa o schema de destino.
-- Assim, qualquer erro desfaz todo o script em vez de deixar um banco
-- parcialmente criado, e objetos não são enviados por engano a outro schema
-- configurado como padrão na sessão do SQL Editor.
begin;
set local search_path = public, pg_temp;


-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================
create extension if not exists "pgcrypto";


-- ============================================================================
-- 2. TYPES
-- ============================================================================
create type user_role as enum ('admin', 'barber', 'customer');

create type booking_status as enum (
  'Aguardando pagamento', 'Confirmado', 'Em atendimento',
  'Concluído', 'Cancelado', 'Não compareceu', 'Reagendado'
);

create type block_type as enum ('block', 'offday', 'vacation', 'special');


-- ============================================================================
-- 3. TABLES
-- ============================================================================
-- Convenções:
--   * profiles.id = auth.users.id (1:1), criado automaticamente no signup
--     via trigger `handle_new_user` (ver seção FUNCTIONS/TRIGGERS).
--   * "single-tenant": existe apenas 1 barbearia por projeto Supabase, por
--     isso `barbershop_config` tem sempre uma única linha (id fixo `true`).
--   * `profiles.profile_id` (aponta para barbers.id quando role='barber') é
--     uma referência lógica, não uma foreign key de verdade — mantido
--     assim de propósito, igual ao schema original.

-- ----------------------------------------------------------------------------
-- profiles (espelha src/types.ts -> User)
-- ----------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  role user_role not null default 'customer',
  phone text,
  avatar text,
  profile_id uuid, -- aponta para barbers.id quando role = 'barber'
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- barbershop_config (espelha BarbershopConfig — linha única)
-- ----------------------------------------------------------------------------
create table barbershop_config (
  id boolean primary key default true constraint single_row check (id),
  name text not null default 'Barbearia',
  logo text not null default '',
  address text not null default '',
  phone text not null default '',
  working_hours jsonb not null default '{"open":"09:00","close":"19:00","daysOpen":[1,2,3,4,5,6]}',
  social_links jsonb not null default '{}',
  booking_fee numeric(10,2) not null default 0,
  tolerance_minutes int not null default 15,
  interval_minutes int not null default 30,
  booking_window_days int not null default 3 check (booking_window_days between 1 and 365),
  pix_key text,
  hero_title text,
  hero_subtitle text,
  hero_description text,
  about_text text,
  updated_at timestamptz not null default now()
);
insert into barbershop_config (id) values (true);

-- ----------------------------------------------------------------------------
-- barbers
-- ----------------------------------------------------------------------------
create table barbers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  avatar text not null default '',
  specialty text not null default '',
  active boolean not null default true,
  working_hours jsonb,
  description text,
  "order" int not null default 0,
  user_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- services
-- ----------------------------------------------------------------------------
create table services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  duration int not null,
  price numeric(10,2) not null,
  description text not null default '',
  category text not null default '',
  active boolean not null default true,
  "order" int not null default 0,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- bookings
-- ----------------------------------------------------------------------------
create table bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references profiles(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  barber_id uuid not null references barbers(id) on delete restrict,
  service_id text not null, -- csv de services.id (multi-serviço no mesmo agendamento)
  date date not null,
  time time not null,
  status booking_status not null default 'Aguardando pagamento',
  notes text,
  fee_paid boolean not null default false,
  customer_confirmed boolean not null default false,
  value numeric(10,2) not null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- schedule_blocks
-- ----------------------------------------------------------------------------
create table schedule_blocks (
  id uuid primary key default gen_random_uuid(),
  barber_id text not null, -- 'all' ou uuid de barbers.id
  type block_type not null,
  date date,
  start_date date,
  end_date date,
  start_time time,
  end_time time,
  reason text,
  special_hours jsonb,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- gallery_photos (fotos de cortes exibidas na home page)
-- ----------------------------------------------------------------------------
create table gallery_photos (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  caption text,
  "order" int not null default 0,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);


-- ============================================================================
-- 4. INDEXES
-- ============================================================================
create index bookings_barber_date_idx on bookings (barber_id, date);
create index bookings_customer_idx on bookings (customer_id);
create index bookings_date_id_idx on bookings (date desc, id);
create index gallery_photos_display_order_idx on gallery_photos (display_order, created_at, id);


-- ============================================================================
-- 5. FUNCTIONS
-- ============================================================================
-- Ordem: `auth_role()` primeiro (usada por quase tudo abaixo, e pelas
-- policies de RLS), depois as demais.

-- Helper: papel do usuário autenticado atual. Usada nas policies de RLS e
-- dentro de outras funções/triggers desta seção.
create function auth_role() returns user_role as $$
  select role from profiles where id = auth.uid();
$$ language sql stable security definer set search_path = public, pg_temp;

-- Garante também no caminho de provisionamento consolidado que um INSERT
-- direto ou feito por uma função SECURITY DEFINER não associe um agendamento
-- ao perfil de outra pessoa. Convidados sempre usam customer_id nulo; apenas
-- administradores podem criar agendamentos em nome de terceiros.
create function enforce_booking_customer_identity()
returns trigger as $$
begin
  if auth.uid() is null and new.customer_id is not null then
    raise exception 'Agendamentos de convidados devem usar customer_id nulo.';
  end if;
  if auth.uid() is not null and auth_role() <> 'admin'
     and new.customer_id is distinct from auth.uid() then
    raise exception 'Não é possível criar um agendamento em nome de outro usuário.';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

-- Cria automaticamente um profile 'customer' quando um usuário se cadastra.
-- Promover para 'admin'/'barber' é feito manualmente (painel admin ou SQL),
-- nunca pelo próprio cadastro público.
create function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', new.email), 'customer');
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

-- Impede que um usuário não-admin altere seu próprio `role` ou
-- `profile_id` através de um UPDATE em `profiles` (ex: chamando a REST API
-- do Supabase diretamente, fora da UI). Sem isto, a policy de UPDATE
-- (`auth.uid() = id or auth_role() = 'admin'`) sozinha permite que
-- qualquer cliente autenticado se autopromova a admin, já que "sou dono da
-- própria linha" continua verdadeiro mesmo depois de trocar o `role`.
create function prevent_profile_privilege_escalation()
returns trigger as $$
begin
  if auth_role() <> 'admin' then
    if new.role <> old.role then
      raise exception 'Apenas administradores podem alterar o papel (role) de um usuário.';
    end if;
    if new.profile_id is distinct from old.profile_id then
      raise exception 'Apenas administradores podem alterar o vínculo profile_id de um usuário.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

-- Restringe o que um cliente pode alterar no próprio agendamento: só pode
-- cancelar (status -> 'Cancelado'), confirmar presença, ou reagendar (e
-- reagendar só é permitido quando a chamada vem de dentro de
-- `reschedule_booking`, sinalizado pela GUC local `app.reschedule_in_progress`
-- — nunca via UPDATE direto sem revalidação de conflito). Admin e o
-- barbeiro dono da agenda continuam podendo alterar qualquer campo.
create function protect_booking_updates()
returns trigger as $$
declare
  v_actor_role user_role;
  v_actor_profile_id uuid;
  v_via_reschedule_rpc boolean;
begin
  v_actor_role := auth_role();

  if v_actor_role = 'admin' then
    return new;
  end if;

  if v_actor_role = 'barber' then
    select profile_id into v_actor_profile_id from profiles where id = auth.uid();
    if v_actor_profile_id is not null and old.barber_id = v_actor_profile_id then
      return new;
    end if;
  end if;

  if auth.uid() = old.customer_id then
    v_via_reschedule_rpc := coalesce(current_setting('app.reschedule_in_progress', true), '') = 'true';

    if new.value <> old.value
      or new.fee_paid <> old.fee_paid
      or new.barber_id <> old.barber_id
      or new.service_id <> old.service_id
      or new.customer_id is distinct from old.customer_id
      or new.customer_name <> old.customer_name
      or new.customer_phone <> old.customer_phone
    then
      raise exception 'Alteração não permitida: clientes só podem cancelar, confirmar presença ou reagendar o próprio agendamento.';
    end if;

    if not v_via_reschedule_rpc and (new.date <> old.date or new.time <> old.time) then
      raise exception 'Para reagendar, utilize a função de reagendamento (que revalida conflitos de horário no servidor).';
    end if;

    if new.status <> old.status and new.status <> 'Cancelado' then
      raise exception 'Cliente só pode alterar o status do próprio agendamento para "Cancelado".';
    end if;

    return new;
  end if;

  raise exception 'Você não tem permissão para alterar este agendamento.';
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

-- Defesa em profundidade para qualquer gravação de reserva: normaliza os
-- dados, aplica os limites antiabuso, recalcula o preço e valida a agenda.
create function validate_booking_business_rules()
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
create function prevent_booking_schedule_conflicts()
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
create function protect_barber_updates()
returns trigger as $$
begin
  if auth_role() = 'admin' then
    return new;
  end if;

  if old.user_id = auth.uid() then
    if new.active <> old.active
      or new.working_hours is distinct from old.working_hours
      or new."order" <> old."order"
      or new.user_id is distinct from old.user_id
    then
      raise exception 'Você só pode alterar seu nome, foto, especialidade e descrição. As demais alterações são feitas pela administração.';
    end if;
    return new;
  end if;

  raise exception 'Você não tem permissão para alterar este profissional.';
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

-- Mantém `profiles.email` sincronizado quando o e-mail é alterado via
-- Supabase Auth (fluxo padrão de troca de e-mail) — sem isto, o e-mail em
-- `profiles` só era gravado uma vez, no cadastro, e ficava desatualizado
-- se o usuário trocasse o e-mail depois.
create function sync_profile_email()
returns trigger as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

-- Cria um agendamento de forma atômica: trava (advisory lock) a combinação
-- barbeiro+data para serializar tentativas concorrentes, revalida
-- conflitos de horário e de bloqueio de agenda no servidor (nunca confiar
-- só na checagem feita no cliente) e só então insere. Evita a condição de
-- corrida de dois clientes reservando o mesmo horário ao mesmo tempo.
--
-- Também valida que um usuário autenticado não crie o agendamento em nome
-- de outro (`p_customer_id` só pode ser nulo — convidado — ou o próprio
-- `auth.uid()`, exceto para admin, que pode criar em nome de qualquer
-- cliente/walk-in).
--
-- Um bloqueio 'special' (schedule_blocks) COM `special_hours` preenchido
-- não fecha mais o dia inteiro: bloqueia só fora da janela customizada (e
-- dentro da pausa customizada, se houver). 'vacation', 'offday' e 'special'
-- SEM `special_hours` continuam fechando o dia inteiro.
--
-- Anti-abuso (não se aplica a admin): um mesmo telefone não pode ter mais
-- de 3 agendamentos simultâneos aguardando pagamento, nem criar mais de 5
-- agendamentos (qualquer status) nas últimas 24h. Sem isto, o agendamento
-- de convidado (sem login, sem captcha) fica aberto para um script lotar a
-- agenda inteira com reservas falsas.
create function create_booking(
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
create function reschedule_booking(
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


-- ============================================================================
-- 6. TRIGGERS
-- ============================================================================
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute procedure sync_profile_email();

create trigger profiles_prevent_privilege_escalation
  before update on profiles
  for each row execute procedure prevent_profile_privilege_escalation();

create trigger bookings_enforce_customer_identity
  before insert on bookings
  for each row execute procedure enforce_booking_customer_identity();

create trigger bookings_protect_updates
  before update on bookings
  for each row execute procedure protect_booking_updates();

create trigger bookings_prevent_schedule_conflicts
  before insert or update of barber_id, service_id, date, time
  on bookings for each row execute procedure prevent_booking_schedule_conflicts();

create trigger bookings_validate_business_rules
  before insert or update of customer_name, customer_phone, barber_id,
    service_id, date, time, notes, value
  on bookings for each row execute procedure validate_booking_business_rules();

create trigger barbers_protect_updates
  before update on barbers
  for each row execute procedure protect_barber_updates();


-- ============================================================================
-- 7. STORAGE
-- ============================================================================
-- Bucket para fotos de barbeiros: público para leitura (aparecem no site
-- institucional sem necessidade de login), só admin pode enviar/substituir/
-- remover.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_public_read" on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_admin_write" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth_role() = 'admin');

create policy "avatars_admin_update" on storage.objects for update
  using (bucket_id = 'avatars' and auth_role() = 'admin');

create policy "avatars_admin_delete" on storage.objects for delete
  using (bucket_id = 'avatars' and auth_role() = 'admin');

-- Bucket para a galeria de cortes (home page): mesmo padrão do 'avatars'.
insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do nothing;

create policy "gallery_public_read" on storage.objects for select
  using (bucket_id = 'gallery');

create policy "gallery_admin_write" on storage.objects for insert
  with check (bucket_id = 'gallery' and auth_role() = 'admin');

create policy "gallery_admin_update" on storage.objects for update
  using (bucket_id = 'gallery' and auth_role() = 'admin');

create policy "gallery_admin_delete" on storage.objects for delete
  using (bucket_id = 'gallery' and auth_role() = 'admin');


-- A validação do navegador é apenas UX; o Storage também limita tamanho e MIME.
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id in ('avatars', 'gallery');

-- Barbeiros podem enviar e substituir somente a própria foto de perfil.
create policy "avatars_barber_insert_own" on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth_role() = 'barber'
    and name like 'barbers/' || (select profile_id::text from profiles where id = auth.uid()) || '-%'
  );
create policy "avatars_barber_update_own" on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth_role() = 'barber'
    and name like 'barbers/' || (select profile_id::text from profiles where id = auth.uid()) || '-%'
  )
  with check (
    bucket_id = 'avatars'
    and auth_role() = 'barber'
    and name like 'barbers/' || (select profile_id::text from profiles where id = auth.uid()) || '-%'
  );


-- ============================================================================
-- 8. POLICIES (Row Level Security)
-- ============================================================================
alter table profiles enable row level security;
alter table barbershop_config enable row level security;
alter table barbers enable row level security;
alter table services enable row level security;
alter table bookings enable row level security;
alter table schedule_blocks enable row level security;
alter table gallery_photos enable row level security;

-- profiles: cada um vê/edita o próprio; admin vê/edita/exclui todos.
-- (a alteração indevida de `role`/`profile_id` pelo próprio dono da linha é
-- bloqueada pelo trigger `profiles_prevent_privilege_escalation`, não por
-- esta policy — ver seção FUNCTIONS/TRIGGERS.)
create policy "profiles_select_own_or_admin" on profiles for select
  using (auth.uid() = id or auth_role() = 'admin');
create policy "profiles_insert_admin" on profiles for insert
  with check (auth_role() = 'admin');
create policy "profiles_update_own_or_admin" on profiles for update
  using (auth.uid() = id or auth_role() = 'admin');
create policy "profiles_delete_admin" on profiles for delete
  using (auth_role() = 'admin');

-- barbershop_config: leitura pública (site institucional), escrita só admin.
create policy "config_select_public" on barbershop_config for select using (true);
create policy "config_update_admin" on barbershop_config for update
  using (auth_role() = 'admin');

-- barbers: leitura pública, escrita só admin (exceto o próprio barbeiro,
-- que pode atualizar seu nome/foto/especialidade/descrição — ver policy
-- abaixo e a trigger protect_barber_updates, que bloqueia campos sensíveis).
create policy "barbers_select_public" on barbers for select using (true);
create policy "barbers_write_admin" on barbers for all
  using (auth_role() = 'admin') with check (auth_role() = 'admin');
create policy "barbers_update_own" on barbers for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- services: leitura pública, escrita só admin.
create policy "services_select_public" on services for select using (true);
create policy "services_write_admin" on services for all
  using (auth_role() = 'admin') with check (auth_role() = 'admin');

-- bookings: cliente vê/cancela os seus; barbeiro vê e gerencia os da
-- própria agenda; admin vê/edita/exclui tudo. (a restrição de QUAIS campos
-- um cliente pode alterar no próprio agendamento é feita pelo trigger
-- `bookings_protect_updates`, não por esta policy.)
create policy "bookings_select_own_barber_or_admin" on bookings for select
  using (
    auth.uid() = customer_id
    or auth_role() = 'admin'
    or (auth_role() = 'barber' and barber_id = (select profile_id from profiles where id = auth.uid()))
  );
create policy "bookings_insert_admin_only" on bookings for insert
  with check (auth_role() = 'admin');
create policy "bookings_update_own_barber_or_admin" on bookings for update
  using (
    auth.uid() = customer_id
    or auth_role() = 'admin'
    or (auth_role() = 'barber' and barber_id = (select profile_id from profiles where id = auth.uid()))
  );
create policy "bookings_delete_admin" on bookings for delete
  using (auth_role() = 'admin');

-- schedule_blocks: leitura pública (para calcular disponibilidade), escrita
-- por admin ou pelo próprio barbeiro (bloqueios da própria agenda).
create policy "blocks_select_public" on schedule_blocks for select using (true);
create policy "blocks_write_admin_or_own_barber" on schedule_blocks for all
  using (auth_role() = 'admin' or barber_id = (select profile_id::text from profiles where id = auth.uid()))
  with check (auth_role() = 'admin' or barber_id = (select profile_id::text from profiles where id = auth.uid()));

-- gallery_photos: leitura pública (aparece na home), escrita só admin.
create policy "gallery_photos_select_public" on gallery_photos for select using (true);
create policy "gallery_photos_write_admin" on gallery_photos for all
  using (auth_role() = 'admin') with check (auth_role() = 'admin');


-- ============================================================================
-- 9. GRANTS
-- ============================================================================
-- Permite chamada tanto por usuários autenticados quanto anônimos
-- (agendamento de convidado, sem conta).
revoke all on function create_booking(uuid, text, text, uuid, text, date, time, text, numeric) from public;
grant execute on function create_booking(
  uuid, text, text, uuid, text, date, time, text, numeric
) to anon, authenticated;

-- Reagendamento exige estar autenticado (cliente, barbeiro ou admin) —
-- convidado não tem uma agenda própria para reagendar por conta própria.
revoke all on function reschedule_booking(uuid, date, time) from public, anon;
grant execute on function reschedule_booking(uuid, date, time) to authenticated;

commit;
