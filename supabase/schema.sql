-- ============================================================================
-- CORE Universal de Agendamento — schema.sql consolidado
-- ============================================================================
-- Este arquivo é a única fonte necessária para um PROJETO NOVO/VAZIO e
-- substitui a execução sequencial das migrations históricas, incluindo:
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
-- Ele representa o ESTADO FINAL do banco —
-- funções que foram substituídas (create_booking, reschedule_booking)
-- aparecem aqui só na versão final; policies/triggers adicionados depois
-- (ex: as de DELETE) já nascem junto com as demais da mesma tabela; e todo
-- comando que só existia para tornar uma migration incremental idempotente
-- (DROP TRIGGER IF EXISTS, DROP POLICY IF EXISTS, CREATE OR REPLACE onde já
-- havia CREATE) foi removido, por não fazer sentido numa criação do zero.
--
-- ⚠️ USO: rode este arquivo INTEIRO, uma única vez, num banco Supabase
-- VAZIO (projeto novo). Se seu projeto já possui schema/migrations aplicados,
-- NÃO rode este arquivo nele — as tabelas/tipos já existem e todo `create
-- table`/`create type` vai falhar com "already exists". Neste caso os dois
-- use somente as novas migrations incrementais. Nunca execute schema e depois
-- migrations no mesmo banco novo.
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
create schema if not exists extensions;
create extension if not exists "pgcrypto";
create extension if not exists btree_gist with schema extensions;


-- ============================================================================
-- 2. TYPES
-- ============================================================================
create type user_role as enum ('owner', 'manager', 'receptionist', 'professional', 'customer');

create type booking_status as enum (
  'Aguardando pagamento', 'Confirmado', 'Em atendimento',
  'Concluído', 'Cancelado', 'Não compareceu'
);

create type block_type as enum ('block', 'offday', 'vacation', 'special');


-- ============================================================================
-- 3. TABLES
-- ============================================================================
-- Convenções:
--   * profiles.id = auth.users.id (1:1), criado automaticamente no signup
--     via trigger `handle_new_user` (ver seção FUNCTIONS/TRIGGERS).
--   * "single-tenant": existe apenas 1 negócio por projeto Supabase;
--     `barbershop_config` é um nome físico legado de compatibilidade e mantém
--     sempre uma única linha (id fixo `true`).
--   * `profiles.profile_id` aponta para `barbers.id` quando
--     role='professional'; trigger, FK e índices únicos mantêm as duas pontas
--     do vínculo consistentes.

-- ----------------------------------------------------------------------------
-- profiles (espelha src/types.ts -> User)
-- ----------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null check (char_length(email) between 3 and 320),
  name text not null check (char_length(btrim(name)) between 2 and 100),
  role user_role not null default 'customer',
  phone text check (
    phone is null or (
      char_length(phone) <= 32
      and phone ~ '^\+?[0-9().[:space:]-]+$'
      and (
        regexp_replace(phone, '[^0-9]', '', 'g') ~ '^[0-9]{10,11}$'
        or regexp_replace(phone, '[^0-9]', '', 'g') ~ '^55[0-9]{10,11}$'
      )
    )
  ),
  avatar text check (avatar is null or char_length(avatar) <= 2048),
  profile_id uuid, -- aponta para barbers.id quando role = 'professional'
  privacy_accepted_at timestamptz,
  privacy_policy_version text check (privacy_policy_version is null or char_length(privacy_policy_version) <= 64),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- barbershop_config (espelha BarbershopConfig — linha única)
-- ----------------------------------------------------------------------------
create table barbershop_config (
  id boolean primary key default true constraint single_row check (id),
  name text not null default 'CORE' check (char_length(btrim(name)) between 2 and 100),
  logo text not null default '' check (char_length(logo) <= 2048),
  address text not null default '' check (char_length(address) <= 500),
  phone text not null default '' check (
    char_length(phone) <= 32
    and (
      btrim(phone) = ''
      or (
        phone ~ '^\+?[0-9().[:space:]-]+$'
        and (
          regexp_replace(phone, '[^0-9]', '', 'g') ~ '^[0-9]{10,11}$'
          or regexp_replace(phone, '[^0-9]', '', 'g') ~ '^55[0-9]{10,11}$'
        )
      )
    )
  ),
  working_hours jsonb not null default '{"open":"09:00","close":"19:00","daysOpen":[1,2,3,4,5,6]}',
  social_links jsonb not null default '{}' check (jsonb_typeof(social_links) = 'object'),
  booking_fee numeric(10,2) not null default 0 check (booking_fee >= 0),
  interval_minutes int not null default 30 check (interval_minutes between 5 and 480),
  booking_window_days int not null default 3 check (booking_window_days between 1 and 365),
  minimum_notice_minutes int not null default 30 check (minimum_notice_minutes between 0 and 525600),
  cancellation_notice_minutes int not null default 0 check (cancellation_notice_minutes between 0 and 525600),
  pix_key text check (pix_key is null or char_length(pix_key) <= 320),
  hero_title text check (hero_title is null or char_length(hero_title) <= 160),
  hero_subtitle text check (hero_subtitle is null or char_length(hero_subtitle) <= 240),
  hero_description text check (hero_description is null or char_length(hero_description) <= 1000),
  about_text text check (about_text is null or char_length(about_text) <= 2000),
  constraint booking_fee_requires_pix check (
    booking_fee = 0 or nullif(btrim(pix_key), '') is not null
  ),
  updated_at timestamptz not null default now()
);
insert into barbershop_config (id) values (true);
comment on table public.barbershop_config is
  'Legacy physical compatibility configuration for the single CORE business installation. Application code uses the neutral BusinessConfig contract.';
comment on column public.barbershop_config.name is
  'Compatibility business name. Fresh installations use the neutral CORE default until onboarding persists the real business identity.';

-- ----------------------------------------------------------------------------
-- barbers
-- ----------------------------------------------------------------------------
create table barbers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 100),
  avatar text not null default '' check (char_length(avatar) <= 2048),
  specialty text not null default '' check (char_length(specialty) <= 120),
  active boolean not null default true,
  working_hours jsonb,
  description text check (description is null or char_length(description) <= 1000),
  "order" int not null default 0,
  user_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- services
-- ----------------------------------------------------------------------------
create table services (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 100),
  duration int not null check (duration between 5 and 480),
  price numeric(10,2) not null check (price >= 0),
  description text not null default '' check (char_length(description) <= 1000),
  category text not null default '' check (char_length(category) <= 100),
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
-- gallery_photos (mídia pública exibida na home page)
-- ----------------------------------------------------------------------------
create table gallery_photos (
  id uuid primary key default gen_random_uuid(),
  image_url text not null check (char_length(btrim(image_url)) between 1 and 2048),
  caption text check (caption is null or char_length(caption) <= 500),
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
create unique index barbers_user_id_idx on barbers (user_id) where user_id is not null;
create index gallery_photos_display_order_idx on gallery_photos (display_order, created_at, id);
create unique index profiles_one_user_per_professional_idx on profiles (profile_id) where profile_id is not null;

alter table profiles
  add constraint profiles_profile_id_fkey
  foreign key (profile_id) references barbers(id) on delete set null;


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
  if auth.uid() is not null and auth_role() <> 'owner'
     and new.customer_id is distinct from auth.uid() then
    raise exception 'Não é possível criar um agendamento em nome de outro usuário.';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

-- Cria automaticamente um profile 'customer' quando um usuário se cadastra.
-- Promover para 'owner'/'professional' é feito manualmente (painel admin ou SQL),
-- nunca pelo próprio cadastro público.
create function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id, email, name, role, phone, privacy_accepted_at, privacy_policy_version
  )
  values (
    new.id,
    new.email,
    left(coalesce(nullif(btrim(new.raw_user_meta_data->>'name'), ''), new.email), 100),
    'customer',
    left(nullif(btrim(new.raw_user_meta_data->>'phone'), ''), 32),
    case when nullif(new.raw_user_meta_data->>'privacy_policy_version', '') is not null then now() end,
    left(nullif(new.raw_user_meta_data->>'privacy_policy_version', ''), 64)
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

-- Validate the JSON schedule at the database boundary. Availability code
-- casts these values to time/boolean, so one malformed owner update could
-- otherwise break every public booking request until manually repaired.
create function working_hours_are_valid(p_hours jsonb)
returns boolean
language plpgsql
immutable
set search_path = public, pg_temp
as $$
declare
  v_open text;
  v_close text;
  v_break_start text;
  v_break_end text;
  v_key text;
  v_day jsonb;
  v_day_open text;
  v_day_close text;
  v_day_break_start text;
  v_day_break_end text;
begin
  if p_hours is null or jsonb_typeof(p_hours) <> 'object' then
    return false;
  end if;

  v_open := p_hours->>'open';
  v_close := p_hours->>'close';
  v_break_start := p_hours->>'breakStart';
  v_break_end := p_hours->>'breakEnd';

  if v_open is null or v_close is null
     or v_open !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
     or v_close !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
     or v_open::time >= v_close::time
     or jsonb_typeof(p_hours->'daysOpen') <> 'array' then
    return false;
  end if;

  if exists (
    select 1 from jsonb_array_elements_text(p_hours->'daysOpen') day(value)
    where value !~ '^[0-6]$'
  ) or (
    select count(distinct value) from jsonb_array_elements_text(p_hours->'daysOpen') day(value)
  ) <> jsonb_array_length(p_hours->'daysOpen') then
    return false;
  end if;

  if (v_break_start is null) <> (v_break_end is null)
     or (v_break_start is not null and (
       v_break_start !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
       or v_break_end !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
       or v_break_start::time < v_open::time
       or v_break_start::time >= v_break_end::time
       or v_break_end::time > v_close::time
     )) then
    return false;
  end if;

  if p_hours ? 'weeklySchedule' then
    if jsonb_typeof(p_hours->'weeklySchedule') <> 'object' then
      return false;
    end if;

    for v_key, v_day in select key, value from jsonb_each(p_hours->'weeklySchedule') loop
      if v_key !~ '^[0-6]$' or jsonb_typeof(v_day) <> 'object' then
        return false;
      end if;
      if v_day ? 'closed' and jsonb_typeof(v_day->'closed') <> 'boolean' then
        return false;
      end if;

      v_day_open := coalesce(nullif(v_day->>'open', ''), v_open);
      v_day_close := coalesce(nullif(v_day->>'close', ''), v_close);
      v_day_break_start := case when v_day ? 'breakStart' then v_day->>'breakStart' else v_break_start end;
      v_day_break_end := case when v_day ? 'breakEnd' then v_day->>'breakEnd' else v_break_end end;

      if v_day_open !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
         or v_day_close !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
         or v_day_open::time >= v_day_close::time
         or (v_day_break_start is null) <> (v_day_break_end is null)
         or (v_day_break_start is not null and (
           v_day_break_start !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
           or v_day_break_end !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
           or v_day_break_start::time < v_day_open::time
           or v_day_break_start::time >= v_day_break_end::time
           or v_day_break_end::time > v_day_close::time
         )) then
        return false;
      end if;
    end loop;
  end if;

  return true;
exception when others then
  return false;
end;
$$;

create function validate_working_hours_payload()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.working_hours is not null and not working_hours_are_valid(new.working_hours) then
    raise exception using errcode = '23514', message = 'Horário de funcionamento inválido.';
  end if;
  return new;
end;
$$;

-- Links da configuração são exibidos como href na página pública. Valide no
-- banco também, pois um proprietário pode contornar o formulário e chamar a
-- API REST diretamente.
create function validate_social_links_payload()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_key text;
  v_json_value jsonb;
  v_link text;
begin
  if jsonb_typeof(new.social_links) <> 'object' then
    raise exception using errcode = '23514', message = 'Links sociais devem ser um objeto.';
  end if;

  for v_key, v_json_value in select key, value from jsonb_each(new.social_links) loop
    if jsonb_typeof(v_json_value) <> 'string' then
      raise exception using errcode = '23514', message = 'Links sociais devem ser textos.';
    end if;

    v_link := btrim(v_json_value #>> '{}');
    if char_length(v_link) > 2048 then
      raise exception using errcode = '23514', message = 'Link social excede 2048 caracteres.';
    end if;

    if v_key in ('instagram', 'facebook')
       and v_link <> ''
       and v_link !~* '^https?://[^[:space:]/@]+([/:?#][^[:space:]]*)?$' then
      raise exception using errcode = '23514', message = 'Link social deve usar uma URL HTTP(S) absoluta e sem credenciais.';
    end if;
  end loop;

  return new;
end;
$$;

-- Reject malformed blocks even when a privileged client bypasses the UI.
-- Invalid ranges previously saved successfully and could silently close the
-- wrong dates or make the availability functions fail while casting JSON.
create function validate_schedule_block()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_barber_id uuid;
  v_open text;
  v_close text;
  v_break_start text;
  v_break_end text;
begin
  new.reason := nullif(btrim(new.reason), '');
  if new.reason is null or char_length(new.reason) > 200 then
    raise exception using errcode = '23514', message = 'Informe um motivo de até 200 caracteres.';
  end if;

  if new.barber_id <> 'all' then
    begin
      v_barber_id := new.barber_id::uuid;
    exception when invalid_text_representation then
      raise exception using errcode = '23514', message = 'Profissional do bloqueio inválido.';
    end;
    if not exists (select 1 from barbers where id = v_barber_id) then
      raise exception using errcode = '23514', message = 'Profissional do bloqueio não encontrado.';
    end if;
  end if;

  if new.type = 'block' then
    if new.date is null or new.start_time is null or new.end_time is null
       or new.start_time >= new.end_time or new.start_date is not null
       or new.end_date is not null or new.special_hours is not null then
      raise exception using errcode = '23514', message = 'Bloqueio por horário inválido.';
    end if;
  elsif new.type in ('vacation', 'offday') then
    if new.start_time is not null or new.end_time is not null or new.special_hours is not null
       or not (
         (new.date is not null and new.start_date is null and new.end_date is null)
         or (new.date is null and new.start_date is not null and new.end_date is not null and new.start_date <= new.end_date)
       ) then
      raise exception using errcode = '23514', message = 'Período de ausência inválido.';
    end if;
  elsif new.type = 'special' and new.special_hours is null then
    if new.start_time is not null or new.end_time is not null
       or not (
         (new.date is not null and new.start_date is null and new.end_date is null)
         or (new.date is null and new.start_date is not null and new.end_date is not null and new.start_date <= new.end_date)
       ) then
      raise exception using errcode = '23514', message = 'Período especial inválido.';
    end if;
  elsif new.type = 'special' then
    if new.date is null or new.start_date is not null or new.end_date is not null
       or new.start_time is not null or new.end_time is not null
       or jsonb_typeof(new.special_hours) <> 'object' then
      raise exception using errcode = '23514', message = 'Horário especial inválido.';
    end if;

    v_open := new.special_hours->>'open';
    v_close := new.special_hours->>'close';
    v_break_start := new.special_hours->>'breakStart';
    v_break_end := new.special_hours->>'breakEnd';
    if v_open is null or v_close is null
       or v_open !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
       or v_close !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
       or v_open::time >= v_close::time then
      raise exception using errcode = '23514', message = 'Abertura e fechamento especiais são inválidos.';
    end if;

    if (v_break_start is null) <> (v_break_end is null)
       or (v_break_start is not null and (
         v_break_start !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
         or v_break_end !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
         or v_break_start::time < v_open::time
         or v_break_start::time >= v_break_end::time
         or v_break_end::time > v_close::time
       )) then
      raise exception using errcode = '23514', message = 'Pausa do horário especial inválida.';
    end if;
  end if;

  return new;
end;
$$;

-- Impede que um usuário não-admin altere seu próprio `role` ou
-- `profile_id` através de um UPDATE em `profiles` (ex: chamando a REST API
-- do Supabase diretamente, fora da UI). Sem isto, a policy de UPDATE
-- (`auth.uid() = id or auth_role() = 'owner'`) sozinha permite que
-- qualquer cliente autenticado se autopromova a admin, já que "sou dono da
-- própria linha" continua verdadeiro mesmo depois de trocar o `role`.
create function prevent_profile_privilege_escalation()
returns trigger as $$
begin
  if new.email is distinct from old.email
     and new.email is distinct from (
       select users.email from auth.users users where users.id = new.id
     ) then
    raise exception 'O e-mail do perfil só pode ser alterado pelo fluxo de autenticação.';
  end if;

  if auth_role() <> 'owner' then
    if new.role <> old.role then
      raise exception 'Apenas administradores podem alterar o papel (role) de um usuário.';
    end if;
    if new.profile_id is distinct from old.profile_id then
      raise exception 'Apenas administradores podem alterar o vínculo profile_id de um usuário.';
    end if;
    if new.privacy_accepted_at is distinct from old.privacy_accepted_at
       or new.privacy_policy_version is distinct from old.privacy_policy_version then
      raise exception 'O registro de aceite de privacidade não pode ser alterado pelo usuário.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

-- Restringe o que um cliente pode alterar no próprio agendamento: só pode
-- cancelar (status -> 'Cancelado'), confirmar presença, ou reagendar (e
-- reagendar só é permitido quando a chamada vem de dentro de
-- `reschedule_booking`, sinalizado pela GUC local `app.reschedule_in_progress`
-- — nunca via UPDATE direto sem revalidação de conflito). O proprietário
-- mantém a administração completa; o profissional dono da agenda segue a
-- máquina de estados e não pode adulterar identidade, preço ou serviço.
create function protect_booking_updates()
returns trigger as $$
declare
  v_actor_role user_role;
  v_actor_profile_id uuid;
  v_via_reschedule_rpc boolean;
begin
  v_actor_role := auth_role();

  if new.created_at is distinct from old.created_at
     or new.starts_at is distinct from old.starts_at
     or new.ends_at is distinct from old.ends_at
     or new.duration_minutes is distinct from old.duration_minutes then
    raise exception 'Os identificadores temporais do agendamento são controlados exclusivamente pelo servidor.';
  end if;

  if v_actor_role = 'owner' then
    return new;
  end if;

  if v_actor_role = 'professional' then
    select profile_id into v_actor_profile_id from profiles where id = auth.uid();
    if v_actor_profile_id is not null and old.barber_id = v_actor_profile_id then
      v_via_reschedule_rpc := coalesce(current_setting('app.reschedule_in_progress', true), '') = 'true';

      if new.customer_id is distinct from old.customer_id
         or new.customer_name is distinct from old.customer_name
         or new.customer_phone is distinct from old.customer_phone
         or new.barber_id is distinct from old.barber_id
         or new.service_id is distinct from old.service_id
         or new.value is distinct from old.value
         or new.customer_confirmed is distinct from old.customer_confirmed
         or new.notes is distinct from old.notes then
        raise exception 'Profissionais só podem atualizar o andamento e a confirmação de pagamento do agendamento.';
      end if;

      if not v_via_reschedule_rpc and (
        new.date is distinct from old.date or new.time is distinct from old.time
      ) then
        raise exception 'Para reagendar, utilize a função de reagendamento validada pelo servidor.';
      end if;

      if old.status in ('Concluído', 'Cancelado', 'Não compareceu') and (
        new.status is distinct from old.status
        or new.fee_paid is distinct from old.fee_paid
      ) then
        raise exception 'Um agendamento finalizado não pode ser alterado pelo profissional.';
      end if;

      if new.fee_paid is distinct from old.fee_paid and not (
        old.fee_paid = false and new.fee_paid = true
        and old.status = 'Aguardando pagamento' and new.status = 'Confirmado'
      ) then
        raise exception 'A confirmação de pagamento só pode acompanhar a confirmação da reserva.';
      end if;

      if new.status is distinct from old.status and not (
        (old.status = 'Aguardando pagamento' and new.status in ('Confirmado', 'Cancelado', 'Não compareceu'))
        or (old.status = 'Confirmado' and new.status in ('Em atendimento', 'Cancelado', 'Não compareceu'))
        or (old.status = 'Em atendimento' and new.status in ('Concluído', 'Cancelado', 'Não compareceu'))
      ) then
        raise exception 'Transição de status inválida para o profissional.';
      end if;

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
      or new.notes is distinct from old.notes
    then
      raise exception 'Alteração não permitida: clientes só podem cancelar, confirmar presença ou reagendar o próprio agendamento.';
    end if;

    if not v_via_reschedule_rpc and (new.date <> old.date or new.time <> old.time) then
      raise exception 'Para reagendar, utilize a função de reagendamento (que revalida conflitos de horário no servidor).';
    end if;

    if new.status <> old.status and new.status <> 'Cancelado' then
      raise exception 'Cliente só pode alterar o status do próprio agendamento para "Cancelado".';
    end if;

    if new.status is distinct from old.status
       and new.customer_confirmed is distinct from old.customer_confirmed then
      raise exception 'Cancelamento e confirmação de presença devem ser operações separadas.';
    end if;

    if new.customer_confirmed is distinct from old.customer_confirmed and not (
      old.customer_confirmed = false
      and new.customer_confirmed = true
      and old.status in ('Aguardando pagamento', 'Confirmado')
      and old.starts_at > now()
    ) then
      raise exception 'A presença só pode ser confirmada uma vez, antes de um agendamento ativo.';
    end if;

    if new.status = 'Cancelado' and old.status <> 'Cancelado'
       and old.status in ('Concluído', 'Não compareceu') then
      raise exception 'Um agendamento finalizado não pode ser cancelado.';
    end if;

    if new.status = 'Cancelado' and old.status <> 'Cancelado'
       and old.starts_at <= now() + make_interval(mins => coalesce((
         select settings.cancellation_notice_minutes
         from public.booking_settings settings where settings.id = true
       ), 0)) then
      raise exception 'O prazo mínimo para cancelamento deste agendamento já foi ultrapassado.';
    end if;

    return new;
  end if;

  raise exception 'Você não tem permissão para alterar este agendamento.';
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

-- Um não comparecimento só existe depois que o horário reservado começou.
-- A regra vale inclusive para o proprietário, pois é uma invariável temporal
-- do agendamento e não apenas uma restrição de autorização da interface.
create function prevent_premature_booking_no_show()
returns trigger as $$
begin
  if new.status = 'Não compareceu'
     and new.status is distinct from old.status
     and old.starts_at > now() then
    raise exception 'Não é possível registrar ausência antes do início do horário reservado.';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

-- Defesa em profundidade para qualquer gravação de reserva: normaliza os
-- dados, aplica os limites antiabuso, recalcula o preço e valida a agenda.
create function public.resolve_working_hours_for_date(
  p_hours jsonb,
  p_date date,
  p_special_hours jsonb default null
)
returns jsonb
language plpgsql
immutable
set search_path = public, pg_temp
as $$
declare
  v_weekday integer;
  v_daily jsonb;
  v_open_on_day boolean;
begin
  if p_hours is null or p_date is null then
    return null;
  end if;

  if p_special_hours is not null then
    return p_special_hours;
  end if;

  v_weekday := extract(dow from p_date)::integer;
  v_daily := p_hours->'weeklySchedule'->(v_weekday::text);
  select exists (
    select 1
    from jsonb_array_elements_text(coalesce(p_hours->'daysOpen', '[]'::jsonb)) day_value
    where day_value::integer = v_weekday
  ) into v_open_on_day;

  if v_daily is not null then
    if coalesce((v_daily->>'closed')::boolean, not v_open_on_day) then
      return null;
    end if;
    return p_hours || v_daily;
  end if;

  if not v_open_on_day then
    return null;
  end if;
  return p_hours;
end;
$$;

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
  v_shop_hours jsonb;
  v_professional_hours jsonb;
  v_shop_special_hours jsonb;
  v_professional_special_hours jsonb;
  v_barber_active boolean;
  v_start_mins int;
  v_end_mins int;
  v_open_mins int;
  v_close_mins int;
  v_shop_open_mins int;
  v_shop_close_mins int;
  v_professional_open_mins int;
  v_professional_close_mins int;
  v_interval_minutes int;
  v_timezone text;
  v_today date;
  v_now_mins int;
  v_minimum_notice_minutes int;
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

  select
    coalesce((select timezone from public.business_profile where id = true), 'America/Sao_Paulo'),
    coalesce((select minimum_notice_minutes from public.booking_settings where id = true), 30)
  into v_timezone, v_minimum_notice_minutes;

  v_today := (now() at time zone v_timezone)::date;
  v_now_mins := extract(hour from (now() at time zone v_timezone)) * 60
                + extract(minute from (now() at time zone v_timezone));

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
  if new.customer_phone !~ '^\+?[0-9().[:space:]-]+$'
     or char_length(v_local_digits) not in (10, 11) then
    raise exception 'Telefone inválido. Informe DDD e número.';
  end if;

  -- `auth_role() <> 'owner'` resulta em NULL para visitantes anônimos nas
  -- versões anteriores da RPC e, em PL/pgSQL, o IF não era executado. Use
  -- IS DISTINCT FROM para que o rate limit cubra convidados de verdade.
  if tg_op = 'INSERT' and v_actor_role is distinct from 'owner' then
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
  -- Reagendamentos preservam preço e duração aceitos na reserva original.
  -- Novas reservas ou mudanças reais de serviço usam o catálogo atual.
  if tg_op = 'UPDATE'
     and new.service_id is not distinct from old.service_id
     and old.duration_minutes is not null then
    v_duration := old.duration_minutes;
    new.value := old.value;
  else
    -- O preço exibido pelo navegador nunca é fonte de verdade.
    new.value := v_price;
  end if;

  select b.active, c.working_hours, coalesce(b.working_hours, c.working_hours),
         c.booking_window_days, c.interval_minutes
    into v_barber_active, v_shop_hours, v_professional_hours,
         v_booking_window_days, v_interval_minutes
  from barbers b cross join barbershop_config c
  where b.id = new.barber_id and c.id = true;

  if not found or not v_barber_active then
    raise exception 'Profissional inválido ou indisponível.';
  end if;

  if v_actor_role is distinct from 'owner' then
    if new.date < v_today or new.date > v_today + (v_booking_window_days - 1) then
      raise exception 'A data deve estar dentro da janela pública de agendamento.';
    end if;
    v_start_mins := extract(hour from new.time) * 60 + extract(minute from new.time);
    if new.date = v_today and v_start_mins <= v_now_mins + v_minimum_notice_minutes then
      raise exception 'O horário precisa respeitar a antecedência mínima configurada.';
    end if;
  else
    v_start_mins := extract(hour from new.time) * 60 + extract(minute from new.time);
  end if;

  select sb.special_hours into v_shop_special_hours
  from schedule_blocks sb
  where sb.type = 'special' and sb.special_hours is not null
    and sb.date = new.date
    and sb.barber_id = 'all'
  limit 1;

  select sb.special_hours into v_professional_special_hours
  from schedule_blocks sb
  where sb.type = 'special' and sb.special_hours is not null
    and sb.date = new.date
    and sb.barber_id = new.barber_id::text
  limit 1;

  v_shop_hours := public.resolve_working_hours_for_date(
    v_shop_hours, new.date, v_shop_special_hours
  );
  v_professional_hours := public.resolve_working_hours_for_date(
    v_professional_hours, new.date, v_professional_special_hours
  );

  if v_shop_hours is null or v_professional_hours is null then
    raise exception 'O profissional não trabalha nesta data.';
  end if;

  v_shop_open_mins := split_part(v_shop_hours->>'open', ':', 1)::int * 60
                      + split_part(v_shop_hours->>'open', ':', 2)::int;
  v_shop_close_mins := split_part(v_shop_hours->>'close', ':', 1)::int * 60
                       + split_part(v_shop_hours->>'close', ':', 2)::int;
  v_professional_open_mins := split_part(v_professional_hours->>'open', ':', 1)::int * 60
                              + split_part(v_professional_hours->>'open', ':', 2)::int;
  v_professional_close_mins := split_part(v_professional_hours->>'close', ':', 1)::int * 60
                               + split_part(v_professional_hours->>'close', ':', 2)::int;
  v_open_mins := greatest(v_shop_open_mins, v_professional_open_mins);
  v_close_mins := least(v_shop_close_mins, v_professional_close_mins);
  v_end_mins := v_start_mins + v_duration;
  if v_start_mins < v_open_mins or v_end_mins > v_close_mins then
    raise exception 'Horário fora do expediente do profissional.';
  end if;

  if mod(v_start_mins - v_open_mins, v_interval_minutes) <> 0 then
    raise exception 'Horário fora da grade de agendamento configurada.';
  end if;

  if (
    v_shop_hours->>'breakStart' is not null and v_shop_hours->>'breakEnd' is not null
    and (split_part(v_shop_hours->>'breakStart', ':', 1)::int * 60
         + split_part(v_shop_hours->>'breakStart', ':', 2)::int) < v_end_mins
    and (split_part(v_shop_hours->>'breakEnd', ':', 1)::int * 60
         + split_part(v_shop_hours->>'breakEnd', ':', 2)::int) > v_start_mins
  ) or (
    v_professional_hours->>'breakStart' is not null and v_professional_hours->>'breakEnd' is not null
    and (split_part(v_professional_hours->>'breakStart', ':', 1)::int * 60
         + split_part(v_professional_hours->>'breakStart', ':', 2)::int) < v_end_mins
    and (split_part(v_professional_hours->>'breakEnd', ':', 1)::int * 60
         + split_part(v_professional_hours->>'breakEnd', ':', 2)::int) > v_start_mins
  ) then
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
          + coalesce(b.duration_minutes, (select sum(s.duration) from services s where s.id::text = any(string_to_array(b.service_id, ','))), 30) > v_start_mins
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
  if auth_role() = 'owner' then
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

-- `barbers.user_id` is the canonical administrative link. Keep the mirrored
-- `profiles.profile_id` value synchronized in the same transaction so a
-- partial network failure can never leave the professional dashboard linked
-- on only one side.
create function sync_barber_user_link()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'UPDATE' and new.user_id is not distinct from old.user_id then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.user_id is not null then
    update profiles set profile_id = null
    where id = old.user_id and profile_id = old.id;
  end if;

  if new.user_id is not null then
    if not exists (
      select 1 from profiles
      where id = new.user_id and role = 'professional'
    ) then
      raise exception using errcode = '23514', message = 'A conta vinculada precisa ter o papel de profissional.';
    end if;

    update profiles set profile_id = new.id where id = new.user_id;
  end if;

  return new;
end;
$$;

-- Reject direct profile edits that would disagree with the canonical
-- barbers.user_id link or attach a non-professional account to an agenda.
create function validate_profile_professional_link()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.profile_id is null then
    if exists (select 1 from barbers where user_id = new.id) then
      raise exception using errcode = '23514', message = 'Desvincule a conta pelo cadastro do profissional.';
    end if;
  elsif new.role <> 'professional'
     or not exists (
       select 1 from barbers
       where id = new.profile_id and user_id = new.id
     ) then
    raise exception using errcode = '23514', message = 'Vínculo entre conta e profissional inconsistente.';
  end if;

  return new;
end;
$$;

-- Reordering is one all-or-nothing operation. Sending one UPDATE per photo
-- allowed partial order changes whenever a request failed midway.
create function reorder_gallery_photos(p_photo_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_total integer;
begin
  if auth.uid() is null or auth_role() is distinct from 'owner' then
    raise exception using errcode = '42501', message = 'Somente o proprietário pode reordenar a galeria.';
  end if;

  select count(*) into v_total from gallery_photos;
  if p_photo_ids is null
     or cardinality(p_photo_ids) <> v_total
     or cardinality(p_photo_ids) <> (select count(distinct id) from unnest(p_photo_ids) item(id))
     or exists (
       select 1 from unnest(p_photo_ids) item(id)
       where not exists (select 1 from gallery_photos photo where photo.id = item.id)
     ) then
    raise exception using errcode = '22023', message = 'A lista de fotos não corresponde à galeria atual.';
  end if;

  update gallery_photos photo
  set display_order = (ordered.position - 1)::int,
      "order" = (ordered.position - 1)::int
  from unnest(p_photo_ids) with ordinality ordered(id, position)
  where photo.id = ordered.id;
end;
$$;

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
  v_booking_fee numeric;
  v_initial_status booking_status;
  v_start_mins int;
  v_end_mins int;
  v_conflict_count int;
  v_new_booking bookings;
begin
  if auth_role() is distinct from 'owner' and auth.uid() is not null and p_customer_id is distinct from auth.uid() then
    raise exception 'Não é possível criar um agendamento em nome de outro usuário.';
  end if;

  -- Serializa chamadas concorrentes para o mesmo barbeiro+data.
  perform pg_advisory_xact_lock(hashtextextended(p_barber_id::text || p_date::text, 0));

  select coalesce(sum(duration), 0) into v_duration
  from services
  where id::text = any(string_to_array(p_service_id, ','));

  if v_duration = 0 then
    raise exception 'Serviço inválido.';
  end if;

  select booking_fee into v_booking_fee
  from barbershop_config where id = true;

  -- Sem taxa de reserva configurada (R$0 ou nula), não há pagamento a
  -- aguardar — o agendamento nasce direto como 'Confirmado'. Antes desta
  -- correção, cada agendamento novo começava em 'Aguardando pagamento'
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
      + coalesce(b.duration_minutes, (select sum(s.duration) from services s where s.id::text = any(string_to_array(b.service_id, ','))), 30)
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

-- Administrative walk-ins need the same atomic conflict validation as the
-- public flow, but their chosen operational status and payment flag must be
-- committed in the same transaction. Keeping this in a separate RPC prevents
-- anonymous callers from supplying privileged fields to create_booking.
create function create_admin_booking(
  p_customer_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_barber_id uuid,
  p_service_id text,
  p_date date,
  p_time time,
  p_notes text,
  p_status booking_status,
  p_fee_paid boolean
) returns bookings
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_booking bookings;
begin
  if auth.uid() is null or auth_role() is distinct from 'owner' then
    raise exception using errcode = '42501', message = 'Somente o proprietário pode criar agendamentos administrativos.';
  end if;

  if p_status is null or p_status not in ('Confirmado', 'Concluído') then
    raise exception using errcode = '22023', message = 'Status administrativo inválido.';
  end if;

  select * into v_booking
  from create_booking(
    p_customer_id, p_customer_name, p_customer_phone, p_barber_id,
    p_service_id, p_date, p_time, p_notes, 0
  );

  update bookings
  set status = p_status,
      fee_paid = coalesce(p_fee_paid, false)
  where id = v_booking.id
  returning * into v_booking;

  return v_booking;
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
    or v_actor_role = 'owner'
    or (v_actor_role = 'professional' and v_booking.barber_id = (select profile_id from profiles where id = auth.uid()))
  ) then
    raise exception 'Você não tem permissão para reagendar este agendamento.';
  end if;

  if v_booking.status in ('Concluído', 'Cancelado', 'Não compareceu') then
    raise exception 'Não é possível reagendar um agendamento finalizado.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_booking.barber_id::text || p_new_date::text, 0));

  v_duration := coalesce(v_booking.duration_minutes, 30);

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
      + coalesce(b.duration_minutes, (select sum(s.duration) from services s where s.id::text = any(string_to_array(b.service_id, ','))), 30)
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

-- Keep audit timestamps reliable even when rows are updated outside the UI.
create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
begin
  new.updated_at := clock_timestamp();
  return new;
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

create trigger profiles_validate_professional_link
  before insert or update of profile_id, role on profiles
  for each row execute procedure validate_profile_professional_link();

create trigger schedule_blocks_validate
  before insert or update on schedule_blocks
  for each row execute procedure validate_schedule_block();

create trigger config_validate_working_hours
  before insert or update of working_hours on barbershop_config
  for each row execute procedure validate_working_hours_payload();

create trigger config_validate_social_links
  before insert or update of social_links on barbershop_config
  for each row execute procedure validate_social_links_payload();

create trigger config_touch_updated_at
  before update on barbershop_config
  for each row execute procedure public.touch_updated_at();

create trigger barbers_validate_working_hours
  before insert or update of working_hours on barbers
  for each row execute procedure validate_working_hours_payload();

create trigger bookings_enforce_customer_identity
  before insert on bookings
  for each row execute procedure enforce_booking_customer_identity();

create trigger bookings_protect_updates
  before update on bookings
  for each row execute procedure protect_booking_updates();

create trigger bookings_prevent_premature_no_show
  before update of status on bookings
  for each row execute procedure prevent_premature_booking_no_show();

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

create trigger barbers_sync_user_link
  after insert or update of user_id on barbers
  for each row execute procedure sync_barber_user_link();


-- ============================================================================
-- 7. STORAGE
-- ============================================================================
-- Bucket para fotos de profissionais: público para leitura (aparecem no site
-- institucional sem necessidade de login), só admin pode enviar/substituir/
-- remover.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_public_read" on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_admin_write" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth_role() = 'owner');

create policy "avatars_admin_update" on storage.objects for update
  using (bucket_id = 'avatars' and auth_role() = 'owner');

create policy "avatars_admin_delete" on storage.objects for delete
  using (bucket_id = 'avatars' and auth_role() = 'owner');

-- Bucket para a galeria pública (home page): mesmo padrão do 'avatars'.
insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do nothing;

create policy "gallery_public_read" on storage.objects for select
  using (bucket_id = 'gallery');

create policy "gallery_admin_write" on storage.objects for insert
  with check (bucket_id = 'gallery' and auth_role() = 'owner');

create policy "gallery_admin_update" on storage.objects for update
  using (bucket_id = 'gallery' and auth_role() = 'owner');

create policy "gallery_admin_delete" on storage.objects for delete
  using (bucket_id = 'gallery' and auth_role() = 'owner');

-- Identidade visual pública. Escrita limitada ao proprietário e a nomes
-- únicos gerados pelo editor de logo; não há overwrite/cache stale.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'branding',
  'branding',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "branding_public_read" on storage.objects for select
  using (bucket_id = 'branding');

create policy "branding_owner_insert" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'branding'
    and auth_role() = 'owner'
    and name ~ '^logos/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$'
  );

create policy "branding_owner_update" on storage.objects for update to authenticated
  using (bucket_id = 'branding' and auth_role() = 'owner')
  with check (
    bucket_id = 'branding'
    and auth_role() = 'owner'
    and name ~ '^logos/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$'
  );

create policy "branding_owner_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'branding' and auth_role() = 'owner');


-- A validação do navegador é apenas UX; o Storage também limita tamanho e MIME.
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id in ('avatars', 'gallery', 'branding');

-- Profissionais podem enviar e substituir somente a própria foto de perfil.
create policy "avatars_barber_insert_own" on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth_role() = 'professional'
    and name like 'barbers/' || (select profile_id::text from profiles where id = auth.uid()) || '-%'
  );
create policy "avatars_barber_update_own" on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth_role() = 'professional'
    and name like 'barbers/' || (select profile_id::text from profiles where id = auth.uid()) || '-%'
  )
  with check (
    bucket_id = 'avatars'
    and auth_role() = 'professional'
    and name like 'barbers/' || (select profile_id::text from profiles where id = auth.uid()) || '-%'
  );

create policy "avatars_barber_delete_own" on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth_role() = 'professional'
    and (
      name like 'barbers/' || (select profile_id::text from profiles where id = auth.uid()) || '-%'
      or name like 'professionals/' || (select profile_id::text from profiles where id = auth.uid()) || '-%'
    )
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
create policy profiles_select_own_or_admin on public.profiles for select
using (((select auth.uid()) = id) or ((select public.auth_role()) = 'owner'));
create policy "profiles_insert_admin" on profiles for insert
  with check (auth_role() = 'owner');
create policy "profiles_update_own_or_admin" on profiles for update
  to authenticated
  using ((select auth.uid()) = id or (select auth_role()) = 'owner')
  with check ((select auth.uid()) = id or (select auth_role()) = 'owner');
create policy "profiles_delete_admin" on profiles for delete
  using (auth_role() = 'owner');

-- barbershop_config: leitura pública (site institucional), escrita só admin.
create policy "config_select_public" on barbershop_config for select using (true);
create policy "config_update_admin" on barbershop_config for update
  using (auth_role() = 'owner');

-- barbers: tabela física legada de profissionais; leitura pública e escrita administrativa (exceto o próprio profissional,
-- que pode atualizar seu nome/foto/especialidade/descrição — ver policy
-- abaixo e a trigger protect_barber_updates, que bloqueia campos sensíveis).
create policy "barbers_select_public" on barbers for select using (true);
create policy barbers_insert_admin on public.barbers for insert
with check ((select public.auth_role()) = 'owner');
create policy barbers_delete_admin on public.barbers for delete
using ((select public.auth_role()) = 'owner');
create policy barbers_update_own on public.barbers for update
using ((select public.auth_role()) = 'owner' or user_id = (select auth.uid()))
with check ((select public.auth_role()) = 'owner' or user_id = (select auth.uid()));

-- services: leitura pública, escrita só admin.
create policy "services_select_public" on services for select using (true);
create policy services_insert_admin on public.services for insert
with check ((select public.auth_role()) = 'owner');
create policy services_update_admin on public.services for update
using ((select public.auth_role()) = 'owner') with check ((select public.auth_role()) = 'owner');
create policy services_delete_admin on public.services for delete
using ((select public.auth_role()) = 'owner');

-- bookings: cliente vê/cancela os seus; profissional vê e gerencia os da
-- própria agenda; admin vê/edita/exclui tudo. (a restrição de QUAIS campos
-- um cliente pode alterar no próprio agendamento é feita pelo trigger
-- `bookings_protect_updates`, não por esta policy.)
create policy bookings_select_own_barber_or_admin on public.bookings for select
using (
  ((select auth.uid()) = customer_id)
  or ((select public.auth_role()) = 'owner')
  or (
    (select public.auth_role()) = 'professional'
    and barber_id = (
      select profiles.profile_id from public.profiles
      where profiles.id = (select auth.uid())
    )
  )
);
create policy "bookings_insert_admin_only" on bookings for insert
  with check (auth_role() = 'owner');
create policy "bookings_update_own_barber_or_admin" on bookings for update
  to authenticated
  using (
    (select auth.uid()) = customer_id
    or (select auth_role()) = 'owner'
    or ((select auth_role()) = 'professional' and barber_id = (select profile_id from profiles where id = (select auth.uid())))
  )
  with check (
    (select auth.uid()) = customer_id
    or (select auth_role()) = 'owner'
    or ((select auth_role()) = 'professional' and barber_id = (select profile_id from profiles where id = (select auth.uid())))
  );
create policy "bookings_delete_admin" on bookings for delete
  using (auth_role() = 'owner');

-- schedule_blocks: leitura pública (para calcular disponibilidade), escrita
-- por proprietário ou pelo próprio profissional (bloqueios da própria agenda).
create policy "blocks_select_staff" on schedule_blocks for select to authenticated
  using (
    (select auth_role()) = 'owner'
    or (
      (select auth_role()) = 'professional'
      and (
        barber_id = 'all'
        or barber_id = (select profile_id::text from profiles where id = (select auth.uid()))
      )
    )
  );
create policy blocks_insert_admin_or_own_barber on public.schedule_blocks for insert to authenticated
with check (
  (select public.auth_role()) = 'owner'
  or barber_id = (select profiles.profile_id::text from public.profiles where profiles.id = (select auth.uid()))
);
create policy blocks_update_admin_or_own_barber on public.schedule_blocks for update to authenticated
using (
  (select public.auth_role()) = 'owner'
  or barber_id = (select profiles.profile_id::text from public.profiles where profiles.id = (select auth.uid()))
)
with check (
  (select public.auth_role()) = 'owner'
  or barber_id = (select profiles.profile_id::text from public.profiles where profiles.id = (select auth.uid()))
);
create policy blocks_delete_admin_or_own_barber on public.schedule_blocks for delete to authenticated
using (
  (select public.auth_role()) = 'owner'
  or barber_id = (select profiles.profile_id::text from public.profiles where profiles.id = (select auth.uid()))
);

-- gallery_photos: leitura pública (aparece na home), escrita só admin.
create policy "gallery_photos_select_public" on gallery_photos for select using (true);
create policy gallery_photos_insert_admin on public.gallery_photos for insert
with check ((select public.auth_role()) = 'owner');
create policy gallery_photos_update_admin on public.gallery_photos for update
using ((select public.auth_role()) = 'owner') with check ((select public.auth_role()) = 'owner');
create policy gallery_photos_delete_admin on public.gallery_photos for delete
using ((select public.auth_role()) = 'owner');


-- ============================================================================
-- 9. GRANTS
-- ============================================================================
-- `barbers.user_id` is an internal Auth link, not public catalog data. Direct
-- table reads are disabled for browser roles; safe projections below expose
-- only the fields required by each role.
revoke select on table public.barbers from anon, authenticated;
grant select (id) on table public.barbers to authenticated;

create function public.get_public_professionals()
returns table (
  id uuid,
  name text,
  avatar text,
  specialty text,
  active boolean,
  working_hours jsonb,
  description text,
  "order" integer
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select professional.id, professional.name, professional.avatar,
    professional.specialty, professional.active, professional.working_hours,
    professional.description, professional."order"
  from public.barbers professional
  where professional.active = true
  order by professional."order", professional.id;
$$;

create function public.get_admin_professionals()
returns table (
  id uuid,
  name text,
  avatar text,
  specialty text,
  active boolean,
  working_hours jsonb,
  description text,
  "order" integer,
  user_id uuid
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or auth_role() is distinct from 'owner' then
    raise exception using errcode = '42501', message = 'Somente o proprietário pode consultar vínculos de contas.';
  end if;

  return query
  select professional.id, professional.name, professional.avatar,
    professional.specialty, professional.active, professional.working_hours,
    professional.description, professional."order", professional.user_id
  from public.barbers professional
  order by professional."order", professional.id;
end;
$$;

revoke all on function public.get_public_professionals() from public;
grant execute on function public.get_public_professionals() to anon, authenticated;
revoke all on function public.get_admin_professionals() from public, anon;
grant execute on function public.get_admin_professionals() to authenticated;

-- Permite chamada tanto por usuários autenticados quanto anônimos
-- (agendamento de convidado, sem conta).
revoke all on function create_booking(uuid, text, text, uuid, text, date, time, text, numeric) from public;
grant execute on function create_booking(
  uuid, text, text, uuid, text, date, time, text, numeric
) to anon, authenticated;

revoke all on function create_admin_booking(
  uuid, text, text, uuid, text, date, time, text, booking_status, boolean
) from public, anon;
grant execute on function create_admin_booking(
  uuid, text, text, uuid, text, date, time, text, booking_status, boolean
) to authenticated;

revoke all on function reorder_gallery_photos(uuid[]) from public, anon;
grant execute on function reorder_gallery_photos(uuid[]) to authenticated;

-- Reagendamento exige estar autenticado (cliente, profissional ou proprietário) —
-- convidado não tem uma agenda própria para reagendar por conta própria.
revoke all on function reschedule_booking(uuid, date, time) from public, anon;
grant execute on function reschedule_booking(uuid, date, time) to authenticated;

-- ============================================================================
-- 10. UNIVERSAL CORE (consolidated final state)
-- ============================================================================
-- Migrations remain available only for existing installations. New projects
-- execute this schema once and must not replay the migrations afterward.

-- Universal, single-installation business configuration. This migration is
-- additive so existing barbershop installations can migrate without downtime.
create type public.business_niche as enum ('barbershop', 'beauty_salon', 'nail_studio', 'pet_shop');

create function public.resolve_legacy_appearance(
  p_niche_id public.business_niche,
  p_theme_id text
) returns jsonb
language sql
immutable
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'styleId',
    case
      when p_theme_id = 'minimal_light' then 'minimal'
      when p_theme_id in ('graphite_modern', 'urban_steel') then 'modern'
      when p_theme_id = 'premium_dark' and p_niche_id <> 'pet_shop' then 'premium'
      when p_theme_id = 'heritage_copper' and p_niche_id = 'barbershop' then 'heritage'
      when p_theme_id in ('rose_elegance', 'lavender_studio') and p_niche_id = 'beauty_salon' then 'editorial'
      when p_theme_id in ('rose_elegance', 'lavender_studio', 'blush_glass') and p_niche_id = 'nail_studio' then 'showcase'
      when p_theme_id = 'champagne_blush' and p_niche_id in ('beauty_salon', 'nail_studio') then 'premium'
      when p_theme_id = 'forest_clean' and p_niche_id = 'pet_shop' then 'clean'
      when p_theme_id = 'forest_clean' and p_niche_id = 'barbershop' then 'modern'
      when p_theme_id in ('ocean_playful', 'sunshine_pet') and p_niche_id = 'pet_shop' then 'friendly'
      else case p_niche_id
        when 'barbershop' then 'modern'
        when 'beauty_salon' then 'editorial'
        when 'nail_studio' then 'showcase'
        when 'pet_shop' then 'friendly'
      end
    end,
    'paletteId',
    case
      when p_theme_id = 'minimal_light' then 'minimal_white'
      when p_theme_id = 'graphite_modern' then case p_niche_id
        when 'barbershop' then 'graphite'
        when 'beauty_salon' then 'slate'
        when 'nail_studio' then 'sophisticated_black'
        when 'pet_shop' then 'navy'
      end
      when p_theme_id = 'premium_dark' then case p_niche_id
        when 'barbershop' then 'graphite'
        when 'beauty_salon' then 'sophisticated_black'
        when 'nail_studio' then 'sophisticated_black'
        when 'pet_shop' then 'forest'
      end
      when p_theme_id = 'heritage_copper' and p_niche_id = 'barbershop' then 'copper'
      when p_theme_id = 'urban_steel' and p_niche_id = 'barbershop' then 'steel'
      when p_theme_id = 'rose_elegance' and p_niche_id in ('beauty_salon', 'nail_studio') then 'rose'
      when p_theme_id = 'champagne_blush' and p_niche_id in ('beauty_salon', 'nail_studio') then 'champagne'
      when p_theme_id = 'lavender_studio' and p_niche_id in ('beauty_salon', 'nail_studio') then 'lavender'
      when p_theme_id = 'blush_glass' and p_niche_id = 'nail_studio' then 'blush'
      when p_theme_id = 'forest_clean' and p_niche_id in ('barbershop', 'pet_shop') then 'forest'
      when p_theme_id = 'ocean_playful' and p_niche_id = 'pet_shop' then 'ocean'
      when p_theme_id = 'sunshine_pet' and p_niche_id = 'pet_shop' then 'soft_yellow'
      else case p_niche_id
        when 'barbershop' then 'graphite'
        when 'beauty_salon' then 'rose'
        when 'nail_studio' then 'lavender'
        when 'pet_shop' then 'forest'
      end
    end
  );
$$;

create function public.appearance_is_available(
  p_niche_id public.business_niche,
  p_theme_style_id text,
  p_palette_id text
) returns boolean
language sql
immutable
set search_path = public, pg_temp
as $$
  select case p_niche_id
    when 'barbershop' then p_theme_style_id in ('modern', 'premium', 'minimal', 'heritage') and p_palette_id in ('graphite', 'navy', 'copper', 'forest', 'burgundy', 'steel', 'cream', 'minimal_white', 'contemporary_blue')
    when 'beauty_salon' then p_theme_style_id in ('modern', 'premium', 'minimal', 'editorial') and p_palette_id in ('rose', 'nude', 'champagne', 'lavender', 'burgundy', 'sophisticated_black', 'minimal_white', 'terracotta', 'slate')
    when 'nail_studio' then p_theme_style_id in ('modern', 'premium', 'minimal', 'showcase') and p_palette_id in ('lavender', 'blush', 'rose', 'nude', 'burgundy', 'minimal_white', 'sophisticated_black', 'champagne', 'vibrant')
    when 'pet_shop' then p_theme_style_id in ('modern', 'clean', 'minimal', 'friendly') and p_palette_id in ('forest', 'ocean', 'turquoise', 'soft_yellow', 'coral', 'navy', 'aqua', 'minimal_white', 'playful')
    else false
  end;
$$;

create table public.business_profile (
  id boolean primary key default true constraint business_profile_singleton check (id),
  business_name text not null check (char_length(btrim(business_name)) between 2 and 100),
  description text check (description is null or char_length(description) <= 2000),
  logo_url text check (logo_url is null or char_length(logo_url) <= 2048),
  cover_url text check (cover_url is null or char_length(cover_url) <= 2048),
  favicon_url text check (favicon_url is null or char_length(favicon_url) <= 2048),
  phone text check (
    phone is null or (
      char_length(phone) <= 32
      and phone ~ '^\+?[0-9().[:space:]-]+$'
      and (
        regexp_replace(phone, '[^0-9]', '', 'g') ~ '^[0-9]{10,11}$'
        or regexp_replace(phone, '[^0-9]', '', 'g') ~ '^55[0-9]{10,11}$'
      )
    )
  ),
  whatsapp text check (
    whatsapp is null or (
      char_length(whatsapp) <= 32
      and whatsapp ~ '^\+?[0-9().[:space:]-]+$'
      and (
        regexp_replace(whatsapp, '[^0-9]', '', 'g') ~ '^[0-9]{10,11}$'
        or regexp_replace(whatsapp, '[^0-9]', '', 'g') ~ '^55[0-9]{10,11}$'
      )
    )
  ),
  email text check (email is null or char_length(email) <= 320),
  instagram text check (instagram is null or char_length(instagram) <= 2048),
  facebook text check (facebook is null or char_length(facebook) <= 2048),
  website text check (website is null or char_length(website) <= 2048),
  address jsonb not null default '{}'::jsonb check (
    jsonb_typeof(address) = 'object'
    and char_length(coalesce(address->>'formatted', '')) <= 500
  ),
  timezone text not null default 'America/Sao_Paulo' check (char_length(timezone) between 1 and 100),
  currency char(3) not null default 'BRL',
  locale text not null default 'pt-BR' check (char_length(locale) between 2 and 35),
  niche_id public.business_niche not null,
  theme_id text not null default 'minimal_light' check (theme_id in (
    'minimal_light', 'graphite_modern',
    'premium_dark', 'heritage_copper', 'urban_steel',
    'rose_elegance', 'champagne_blush', 'lavender_studio', 'blush_glass',
    'forest_clean', 'ocean_playful', 'sunshine_pet'
  )),
  theme_style_id text not null default 'minimal' check (theme_style_id in (
    'modern', 'premium', 'minimal', 'heritage', 'editorial', 'showcase', 'clean', 'friendly'
  )),
  palette_id text not null default 'minimal_white' check (palette_id in (
    'graphite', 'navy', 'copper', 'forest', 'burgundy', 'steel', 'cream', 'minimal_white', 'contemporary_blue',
    'rose', 'nude', 'champagne', 'lavender', 'sophisticated_black', 'terracotta', 'slate', 'blush', 'vibrant',
    'ocean', 'turquoise', 'soft_yellow', 'coral', 'aqua', 'playful'
  )),
  constraint business_profile_appearance_niche_check check (
    public.appearance_is_available(niche_id, theme_style_id, palette_id)
  ),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.feature_settings (
  capability text primary key check (capability in (
    'online_booking', 'customers', 'professionals', 'services', 'financial',
    'reports', 'pets', 'inventory', 'whatsapp', 'ai', 'advanced_themes',
    'custom_domain', 'loyalty'
  )),
  enabled boolean not null default false,
  configuration jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.booking_settings (
  id boolean primary key default true constraint booking_settings_singleton check (id),
  interval_minutes integer not null default 30 check (interval_minutes between 5 and 480),
  booking_window_days integer not null default 30 check (booking_window_days between 1 and 365),
  minimum_notice_minutes integer not null default 30 check (minimum_notice_minutes between 0 and 525600),
  cancellation_notice_minutes integer not null default 0 check (cancellation_notice_minutes between 0 and 525600),
  updated_at timestamptz not null default now()
);

alter table public.business_profile enable row level security;
alter table public.feature_settings enable row level security;
alter table public.booking_settings enable row level security;

-- Values in this public runtime table must stay compatible with the frontend
-- registries. Invalid timezones or URLs would otherwise break every page.
create function public.validate_business_profile_payload()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog, pg_temp
as $$
declare
  v_link text;
begin
  if not exists (
    select 1 from pg_catalog.pg_timezone_names zone
    where zone.name = new.timezone
  ) then
    raise exception using errcode = '23514', message = 'Fuso horário do negócio inválido.';
  end if;

  if new.email is not null
     and new.email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception using errcode = '23514', message = 'E-mail público do negócio inválido.';
  end if;

  foreach v_link in array array[
    new.logo_url, new.cover_url, new.favicon_url,
    new.instagram, new.facebook, new.website
  ] loop
    if v_link is not null
       and btrim(v_link) <> ''
       and btrim(v_link) !~* '^https?://[^[:space:]/@]+([/:?#][^[:space:]]*)?$' then
      raise exception using errcode = '23514', message = 'URL pública do negócio inválida.';
    end if;
  end loop;

  return new;
end;
$$;

create function public.sync_legacy_business_appearance()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_appearance jsonb;
begin
  if tg_op = 'INSERT' then
    if new.theme_style_id is null
       or new.palette_id is null
       or (new.theme_style_id = 'minimal' and new.palette_id = 'minimal_white' and new.theme_id <> 'minimal_light') then
      v_appearance := public.resolve_legacy_appearance(new.niche_id, new.theme_id);
      new.theme_style_id := v_appearance->>'styleId';
      new.palette_id := v_appearance->>'paletteId';
    end if;
  elsif (new.theme_id is distinct from old.theme_id or new.niche_id is distinct from old.niche_id)
        and new.theme_style_id is not distinct from old.theme_style_id
        and new.palette_id is not distinct from old.palette_id then
    v_appearance := public.resolve_legacy_appearance(new.niche_id, new.theme_id);
    new.theme_style_id := v_appearance->>'styleId';
    new.palette_id := v_appearance->>'paletteId';
  end if;
  return new;
end;
$$;

create policy business_profile_public_read on public.business_profile for select using (true);
create policy business_profile_admin_insert on public.business_profile for insert
with check ((select public.auth_role()) = 'owner');
create policy business_profile_admin_update on public.business_profile for update
using ((select public.auth_role()) = 'owner') with check ((select public.auth_role()) = 'owner');
create policy business_profile_admin_delete on public.business_profile for delete
using ((select public.auth_role()) = 'owner');
create policy feature_settings_public_read on public.feature_settings for select using (true);
create policy feature_settings_admin_insert on public.feature_settings for insert
with check ((select public.auth_role()) = 'owner');
create policy feature_settings_admin_update on public.feature_settings for update
using ((select public.auth_role()) = 'owner') with check ((select public.auth_role()) = 'owner');
create policy feature_settings_admin_delete on public.feature_settings for delete
using ((select public.auth_role()) = 'owner');
create policy booking_settings_public_read on public.booking_settings for select using (true);
create policy booking_settings_admin_insert on public.booking_settings for insert
with check ((select public.auth_role()) = 'owner');
create policy booking_settings_admin_update on public.booking_settings for update
using ((select public.auth_role()) = 'owner') with check ((select public.auth_role()) = 'owner');
create policy booking_settings_admin_delete on public.booking_settings for delete
using ((select public.auth_role()) = 'owner');

create trigger business_profile_validate
  before insert or update on public.business_profile
  for each row execute procedure public.validate_business_profile_payload();

create trigger business_profile_sync_legacy_appearance
  before insert or update of niche_id, theme_id on public.business_profile
  for each row execute procedure public.sync_legacy_business_appearance();

create trigger business_profile_touch_updated_at
  before update on public.business_profile
  for each row execute procedure public.touch_updated_at();

create trigger feature_settings_touch_updated_at
  before update on public.feature_settings
  for each row execute procedure public.touch_updated_at();

create trigger booking_settings_touch_updated_at
  before update on public.booking_settings
  for each row execute procedure public.touch_updated_at();

-- Public booking flows need operational blocks, never staff-only reasons or
-- expired history. This is defined after the universal settings tables so the
-- public window follows the canonical timezone and booking horizon.
create function public.get_public_schedule_blocks()
returns table (
  id uuid,
  barber_id text,
  type public.block_type,
  date date,
  start_date date,
  end_date date,
  start_time time,
  end_time time,
  special_hours jsonb
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with limits as (
    select
      (now() at time zone coalesce(
        (select profile.timezone from public.business_profile profile where profile.id = true),
        'America/Sao_Paulo'
      ))::date as first_date,
      coalesce(
        (select settings.booking_window_days from public.booking_settings settings where settings.id = true),
        (select config.booking_window_days from public.barbershop_config config where config.id = true),
        30
      ) as window_days
  )
  select
    blocks.id, blocks.barber_id, blocks.type, blocks.date,
    blocks.start_date, blocks.end_date, blocks.start_time,
    blocks.end_time, blocks.special_hours
  from public.schedule_blocks blocks
  cross join limits
  where blocks.date between limits.first_date and limits.first_date + (limits.window_days - 1)
     or (
       blocks.start_date is not null and blocks.end_date is not null
       and blocks.start_date <= limits.first_date + (limits.window_days - 1)
       and blocks.end_date >= limits.first_date
     );
$$;

revoke all on function public.get_public_schedule_blocks() from public;
grant execute on function public.get_public_schedule_blocks() to anon, authenticated;

comment on table public.business_profile is 'Singleton identity of this independent installation.';
comment on column public.business_profile.theme_id is 'Legacy compatibility alias. New clients persist theme_style_id and palette_id independently.';
comment on column public.business_profile.theme_style_id is 'Structural public-site style selected from the niche registry.';
comment on column public.business_profile.palette_id is 'Independent brand colour palette selected from the niche registry.';
comment on table public.feature_settings is 'Central capability switches; billing is intentionally out of scope.';

-- Keep the compatibility configuration and the canonical booking settings in
-- the same database transaction whenever an administrator changes the agenda.
create function public.sync_booking_settings_from_config()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.booking_settings (
    id, interval_minutes, booking_window_days,
    minimum_notice_minutes, cancellation_notice_minutes
  ) values (
    true, new.interval_minutes, new.booking_window_days,
    new.minimum_notice_minutes, new.cancellation_notice_minutes
  )
  on conflict (id) do update set
    interval_minutes = excluded.interval_minutes,
    booking_window_days = excluded.booking_window_days,
    minimum_notice_minutes = excluded.minimum_notice_minutes,
    cancellation_notice_minutes = excluded.cancellation_notice_minutes,
    updated_at = now();
  return new;
end;
$$;

create trigger config_sync_booking_settings
after update of interval_minutes, booking_window_days,
  minimum_notice_minutes, cancellation_notice_minutes
on public.barbershop_config
for each row execute function public.sync_booking_settings_from_config();

-- P0: snapshot appointment duration and enforce non-overlap in PostgreSQL.
-- The legacy date/time/service_id columns remain during the compatibility
-- window, but are no longer the database's source of truth for conflicts.
-- btree_gist is installed in the dedicated extensions schema above.

alter table public.bookings
  add column starts_at timestamptz,
  add column ends_at timestamptz,
  add column duration_minutes integer;

create index bookings_professional_starts_at_idx
  on public.bookings (barber_id, starts_at)
  where status <> 'Cancelado';

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
create policy booking_services_admin_insert on public.booking_services for insert
with check ((select public.auth_role()) = 'owner');
create policy booking_services_admin_update on public.booking_services for update
using ((select public.auth_role()) = 'owner') with check ((select public.auth_role()) = 'owner');
create policy booking_services_admin_delete on public.booking_services for delete
using ((select public.auth_role()) = 'owner');

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

  if tg_op = 'UPDATE'
     and new.service_id is not distinct from old.service_id
     and old.duration_minutes is not null then
    v_duration := old.duration_minutes;
  else
    select coalesce(sum(s.duration), 0)::integer into v_duration
    from public.services s
    where s.id::text = any(string_to_array(new.service_id, ','));
  end if;

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
before insert or update on public.bookings
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

-- Expose only the canonical time and duration required to draw public slots.
-- Neither customer data nor booking identifiers leave this privileged boundary.
create function public.get_public_occupied_intervals(
  p_professional_id uuid,
  p_date date,
  p_exclude_booking_id uuid default null
)
returns table (start_time time, duration_minutes integer)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_role public.user_role := public.auth_role();
  v_timezone text;
  v_today date;
  v_window_days integer;
begin
  if p_professional_id is null or p_date is null then
    raise exception using errcode = '22023', message = 'Profissional e data são obrigatórios.';
  end if;

  select
    coalesce((select profile.timezone from public.business_profile profile where profile.id = true), 'America/Sao_Paulo'),
    coalesce((select settings.booking_window_days from public.booking_settings settings where settings.id = true), 30)
  into v_timezone, v_window_days;
  v_today := (now() at time zone v_timezone)::date;

  if v_actor_role is distinct from 'owner'
     and v_actor_role is distinct from 'professional'
     and (p_date < v_today or p_date > v_today + (v_window_days - 1)) then
    raise exception using errcode = '22023', message = 'Data fora da janela pública de agendamento.';
  end if;

  if p_exclude_booking_id is not null and (
    (select auth.uid()) is null
    or not exists (
      select 1
      from public.bookings booking
      where booking.id = p_exclude_booking_id
        and (
          booking.customer_id = (select auth.uid())
          or v_actor_role = 'owner'
          or (
            v_actor_role = 'professional'
            and booking.barber_id = (
              select profile.profile_id from public.profiles profile
              where profile.id = (select auth.uid())
            )
          )
        )
    )
  ) then
    raise exception using errcode = '42501', message = 'Você não pode ignorar o agendamento informado.';
  end if;

  return query
  select
    (booking.starts_at at time zone v_timezone)::time,
    booking.duration_minutes
  from public.bookings booking
  where booking.barber_id = p_professional_id
    and booking.starts_at >= (p_date::timestamp at time zone v_timezone)
    and booking.starts_at < ((p_date + 1)::timestamp at time zone v_timezone)
    and booking.status <> 'Cancelado'
    and (p_exclude_booking_id is null or booking.id <> p_exclude_booking_id)
  order by booking.starts_at;
end;
$$;

revoke all on function public.get_public_occupied_intervals(uuid, date, uuid) from public;
grant execute on function public.get_public_occupied_intervals(uuid, date, uuid) to anon, authenticated;

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

-- P0: safe, one-time owner bootstrap and atomic installation onboarding.
create table public.installation_owners (
  user_id uuid primary key references public.profiles(id) on delete restrict,
  installation_id boolean not null default true unique check (installation_id),
  claimed_at timestamptz not null default now()
);
alter table public.installation_owners enable row level security;
comment on table public.installation_owners is 'Internal bootstrap lock and canonical installation owner; no direct API policies.';

create table public.installation_bootstrap (
  id boolean primary key default true check (id),
  owner_email text not null,
  setup_code_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.installation_bootstrap enable row level security;
revoke all on table public.installation_bootstrap from anon, authenticated;
comment on table public.installation_bootstrap is 'Private, single-use owner enrollment challenge; no browser role can read it.';

create or replace function public.auth_role()
returns public.user_role
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    when exists(select 1 from public.installation_owners where user_id = auth.uid()) then 'owner'::public.user_role
    else (select role from public.profiles where id = auth.uid())
  end;
$$;

create or replace function public.get_onboarding_state()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'completed', coalesce((select onboarding_completed from public.business_profile where id = true), false),
    'ownerExists', exists(select 1 from public.installation_owners)
      or exists(select 1 from public.profiles where role = 'owner')
  );
$$;

-- Run this helper from the Supabase SQL Editor before opening public signup.
-- Only a one-way digest is stored; the returned code is shown exactly once.
create function public.prepare_installation_owner(p_owner_email text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_setup_code text;
begin
  if nullif(btrim(p_owner_email), '') is null
     or btrim(p_owner_email) !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception using errcode = '22023', message = 'Informe o e-mail real do proprietário.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('core:first-owner', 0));
  if exists(select 1 from public.installation_owners)
     or exists(select 1 from public.profiles where role = 'owner') then
    raise exception using errcode = '42501', message = 'O proprietário inicial já foi definido.';
  end if;

  v_setup_code := replace(gen_random_uuid()::text, '-', '')
                  || replace(gen_random_uuid()::text, '-', '');

  insert into public.installation_bootstrap (
    id, owner_email, setup_code_hash, expires_at, consumed_at
  ) values (
    true,
    lower(btrim(p_owner_email)),
    encode(sha256(convert_to(v_setup_code, 'UTF8')), 'hex'),
    now() + interval '24 hours',
    null
  )
  on conflict (id) do update set
    owner_email = excluded.owner_email,
    setup_code_hash = excluded.setup_code_hash,
    expires_at = excluded.expires_at,
    consumed_at = null,
    created_at = now();

  return v_setup_code;
end;
$$;

revoke all on function public.prepare_installation_owner(text) from public, anon, authenticated;
grant execute on function public.prepare_installation_owner(text) to service_role;

create or replace function public.claim_first_owner(p_setup_code text)
returns public.profiles
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile public.profiles;
  v_bootstrap public.installation_bootstrap;
  v_email text;
  v_email_confirmed_at timestamptz;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'Autenticação obrigatória.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('core:first-owner', 0));

  if exists (select 1 from public.installation_owners)
     or exists (select 1 from public.profiles where role = 'owner') then
    raise exception using errcode = '42501', message = 'O proprietário inicial já foi definido.';
  end if;

  if p_setup_code is null or p_setup_code !~ '^[a-f0-9]{64}$' then
    raise exception using errcode = '42501', message = 'Código de instalação inválido.';
  end if;

  select users.email, users.email_confirmed_at
  into v_email, v_email_confirmed_at
  from auth.users users
  where users.id = (select auth.uid());

  select * into v_bootstrap
  from public.installation_bootstrap bootstrap
  where bootstrap.id = true
    and bootstrap.consumed_at is null
    and bootstrap.expires_at > now()
    and bootstrap.owner_email = lower(v_email)
    and bootstrap.setup_code_hash = encode(sha256(convert_to(p_setup_code, 'UTF8')), 'hex')
  for update;

  if not found or v_email_confirmed_at is null then
    raise exception using errcode = '42501', message = 'O código não pertence a uma conta confirmada do proprietário.';
  end if;

  update public.installation_bootstrap
  set consumed_at = now()
  where id = true;

  insert into public.installation_owners(user_id) values (auth.uid());

  update public.profiles
  set role = 'owner'
  where id = auth.uid()
  returning * into v_profile;

  if v_profile.id is null then
    raise exception using errcode = '42501', message = 'Perfil autenticado não encontrado.';
  end if;

  return v_profile;
end;
$$;

revoke all on function public.claim_first_owner(text)
  from public, anon, authenticated, service_role;
comment on function public.claim_first_owner(text) is
  'Internal first-owner claim used only by the atomic onboarding RPC. No browser or service-role Data API execute grant.';
revoke all on function public.get_onboarding_state() from public, anon;
grant execute on function public.get_onboarding_state() to authenticated;

-- P1: generic professional boundary and optional Pet Shop entities.
create or replace view public.professionals
with (security_invoker = true)
as
select id, name, avatar, specialty, active, working_hours, description,
       "order", created_at
from public.barbers;

comment on view public.professionals is 'Generic API name over the legacy barbers table during its migration window.';
revoke all on public.professionals from anon, authenticated;

create or replace function public.capability_enabled(p_capability text)
returns boolean
language sql
stable
security invoker
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
create index pet_notes_author_id_idx on public.pet_notes(author_id);
create index booking_pets_pet_idx on public.booking_pets(pet_id);

alter table public.pets enable row level security;
alter table public.pet_notes enable row level security;
alter table public.booking_pets enable row level security;

create trigger pets_touch_updated_at
  before update on public.pets
  for each row execute procedure public.touch_updated_at();

create policy pets_owner_or_admin_read on public.pets for select
using (owner_id = (select auth.uid()) or (select public.auth_role()) = 'owner');
create policy pets_owner_or_admin_insert on public.pets for insert
with check (
  public.capability_enabled('pets')
  and (owner_id = (select auth.uid()) or (select public.auth_role()) = 'owner')
);
create policy pets_owner_or_admin_update on public.pets for update
using (owner_id = (select auth.uid()) or (select public.auth_role()) = 'owner')
with check (
  public.capability_enabled('pets')
  and (owner_id = (select auth.uid()) or (select public.auth_role()) = 'owner')
);
create policy pets_admin_delete on public.pets for delete
using (public.auth_role() = 'owner');

create policy pet_notes_related_read on public.pet_notes for select
using (
  (select public.auth_role()) = 'owner'
  or exists (
    select 1 from public.pets p
    where p.id = pet_notes.pet_id and p.owner_id = (select auth.uid())
  )
  or (
    (select public.auth_role()) = 'professional'
    and exists (
      select 1 from public.booking_pets bp
      join public.bookings b on b.id = bp.booking_id
      where bp.pet_id = pet_notes.pet_id
        and b.barber_id = (
          select profiles.profile_id from public.profiles
          where profiles.id = (select auth.uid())
        )
    )
  )
);
create policy pet_notes_staff_write on public.pet_notes for insert
with check (
  public.capability_enabled('pets')
  and author_id = (select auth.uid())
  and (select public.auth_role()) in ('owner', 'professional')
);
create policy pet_notes_admin_change on public.pet_notes for update
using (public.auth_role() = 'owner') with check (public.auth_role() = 'owner');
create policy pet_notes_admin_delete on public.pet_notes for delete
using (public.auth_role() = 'owner');

create policy booking_pets_related_read on public.booking_pets for select
using (exists (select 1 from public.bookings b where b.id = booking_id));
create policy booking_pets_admin_insert on public.booking_pets for insert
with check ((select public.auth_role()) = 'owner' and public.capability_enabled('pets'));
create policy booking_pets_admin_update on public.booking_pets for update
using ((select public.auth_role()) = 'owner')
with check ((select public.auth_role()) = 'owner' and public.capability_enabled('pets'));
create policy booking_pets_admin_delete on public.booking_pets for delete
using ((select public.auth_role()) = 'owner');

grant select, insert, update, delete on public.pets to authenticated;
grant select, insert, update, delete on public.pet_notes to authenticated;
grant select, insert, update, delete on public.booking_pets to authenticated;
revoke all on function public.capability_enabled(text) from public, anon;
grant execute on function public.capability_enabled(text) to authenticated;

-- P1: complete onboarding with hours, starter services, team and booking rules.
create function public.complete_business_onboarding(
  p_business_name text,
  p_niche_id public.business_niche,
  p_theme_id text,
  p_phone text,
  p_address text,
  p_capabilities text[],
  p_business_hours jsonb,
  p_services jsonb,
  p_professionals jsonb,
  p_interval_minutes integer,
  p_booking_window_days integer,
  p_setup_code text default null
) returns public.business_profile
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile public.business_profile;
  v_capability text;
  v_service record;
  v_professional record;
begin
  -- On a fresh installation, claim the first owner inside this transaction.
  -- If any later validation/insert fails, PostgreSQL also rolls back code
  -- consumption and owner promotion, so retrying cannot strand the wizard.
  if public.auth_role() is distinct from 'owner' then
    perform public.claim_first_owner(p_setup_code);
  end if;
  if p_business_name is null or length(trim(p_business_name)) not between 2 and 100 then
    raise exception using errcode = '23514', message = 'Informe um nome de negócio válido.';
  end if;
  if p_theme_id !~ '^[a-z][a-z0-9_]*$' then
    raise exception using errcode = '23514', message = 'Tema inválido.';
  end if;
  if p_phone is not null and btrim(p_phone) <> '' and (
       length(trim(p_phone)) > 32
       or p_phone !~ '^\+?[0-9().[:space:]-]+$'
       or (
         regexp_replace(p_phone, '[^0-9]', '', 'g') !~ '^[0-9]{10,11}$'
         and regexp_replace(p_phone, '[^0-9]', '', 'g') !~ '^55[0-9]{10,11}$'
       )
     ) then
    raise exception using errcode = '23514', message = 'Informe um telefone brasileiro válido com DDD.';
  end if;
  if p_address is not null and length(trim(p_address)) > 500 then
    raise exception using errcode = '23514', message = 'Endereço excede o limite de 500 caracteres.';
  end if;
  if not public.working_hours_are_valid(p_business_hours)
     or jsonb_array_length(p_business_hours->'daysOpen') = 0 then
    raise exception using errcode = '23514', message = 'Horário de funcionamento inválido.';
  end if;
  if p_interval_minutes < 5 or p_interval_minutes > 480
     or p_booking_window_days < 1 or p_booking_window_days > 365 then
    raise exception using errcode = '23514', message = 'Configuração da agenda inválida.';
  end if;
  if p_capabilities is null or cardinality(p_capabilities) > 50
     or exists (
       select 1 from unnest(p_capabilities) item
       where item not in (
         'online_booking', 'customers', 'professionals', 'services', 'financial',
         'reports', 'pets', 'inventory', 'whatsapp', 'ai', 'advanced_themes',
         'custom_domain', 'loyalty'
       )
     ) then
    raise exception using errcode = '23514', message = 'Capability inválida.';
  end if;
  if jsonb_typeof(p_services) <> 'array' or jsonb_array_length(p_services) > 100
     or exists (
       select 1 from jsonb_to_recordset(p_services) as item(name text, duration integer, price numeric, category text)
       where item.name is null
          or length(trim(item.name)) not between 2 and 100
          or item.duration is null or item.duration not between 5 and 480
          or item.price is null or item.price < 0 or item.price > 99999999.99
          or length(coalesce(item.category, '')) > 100
     ) then
    raise exception using errcode = '23514', message = 'Lista de serviços iniciais inválida.';
  end if;
  if jsonb_typeof(p_professionals) <> 'array' or jsonb_array_length(p_professionals) > 100
     or exists (
       select 1 from jsonb_to_recordset(p_professionals) as item(name text)
       where item.name is null or length(trim(item.name)) not between 2 and 100
     ) then
    raise exception using errcode = '23514', message = 'Lista de profissionais iniciais inválida.';
  end if;

  insert into public.business_profile (
    id, business_name, phone, address, niche_id, theme_id, onboarding_completed
  ) values (
    true, trim(p_business_name), nullif(trim(p_phone), ''),
    case when nullif(trim(p_address), '') is null then '{}'::jsonb else jsonb_build_object('formatted', trim(p_address)) end,
    p_niche_id, p_theme_id, true
  )
  on conflict (id) do update set
    business_name = excluded.business_name, phone = excluded.phone,
    address = excluded.address, niche_id = excluded.niche_id,
    theme_id = excluded.theme_id, onboarding_completed = true, updated_at = now()
  returning * into v_profile;

  -- Preserve capability rows/configuration and disable only currently enabled
  -- switches before enabling the onboarding selection. Avoiding a whole-table
  -- DELETE keeps the operation compatible with safe-update protections.
  update public.feature_settings
  set enabled = false, updated_at = now()
  where enabled = true;

  foreach v_capability in array p_capabilities loop
    insert into public.feature_settings(capability, enabled) values (v_capability, true)
    on conflict (capability) do update set enabled = true, updated_at = now();
  end loop;

  update public.barbershop_config set
    name = v_profile.business_name, phone = coalesce(v_profile.phone, ''),
    address = coalesce(v_profile.address->>'formatted', ''), working_hours = p_business_hours,
    interval_minutes = p_interval_minutes, booking_window_days = p_booking_window_days,
    updated_at = now()
  where id = true;

  insert into public.booking_settings(id, interval_minutes, booking_window_days)
  values (true, p_interval_minutes, p_booking_window_days)
  on conflict (id) do update set interval_minutes = excluded.interval_minutes,
    booking_window_days = excluded.booking_window_days, updated_at = now();

  for v_service in select * from jsonb_to_recordset(p_services)
    as item(name text, duration integer, price numeric, category text)
  loop
    if length(trim(v_service.name)) between 2 and 100
       and v_service.duration between 5 and 480
       and v_service.price between 0 and 99999999.99
       and not exists (select 1 from public.services s where lower(s.name) = lower(trim(v_service.name))) then
      insert into public.services(name, duration, price, description, category)
      values (trim(v_service.name), v_service.duration, v_service.price, '', coalesce(trim(v_service.category), ''));
    end if;
  end loop;

  for v_professional in select * from jsonb_to_recordset(p_professionals) as item(name text)
  loop
    if length(trim(v_professional.name)) between 2 and 100
       and not exists (select 1 from public.barbers p where lower(p.name) = lower(trim(v_professional.name))) then
      insert into public.barbers(name, avatar, specialty, working_hours)
      values (trim(v_professional.name), '', '', p_business_hours);
    end if;
  end loop;

  return v_profile;
end;
$$;

revoke all on function public.complete_business_onboarding(text, public.business_niche, text, text, text, text[], jsonb, jsonb, jsonb, integer, integer, text) from public, anon;
grant execute on function public.complete_business_onboarding(text, public.business_niche, text, text, text, text[], jsonb, jsonb, jsonb, integer, integer, text) to authenticated;

-- Independent appearance parameters use a named-argument overload while the
-- original onboarding signature remains callable by previously deployed apps.
create function public.complete_business_onboarding(
  p_business_name text,
  p_niche_id public.business_niche,
  p_theme_id text,
  p_theme_style_id text,
  p_palette_id text,
  p_phone text,
  p_address text,
  p_capabilities text[],
  p_business_hours jsonb,
  p_services jsonb,
  p_professionals jsonb,
  p_interval_minutes integer,
  p_booking_window_days integer,
  p_setup_code text default null
) returns public.business_profile
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile public.business_profile;
begin
  if not public.appearance_is_available(p_niche_id, p_theme_style_id, p_palette_id) then
    raise exception using errcode = '23514', message = 'Aparência indisponível para o nicho informado.';
  end if;

  select * into v_profile
  from public.complete_business_onboarding(
    p_business_name, p_niche_id, p_theme_id, p_phone, p_address,
    p_capabilities, p_business_hours, p_services, p_professionals,
    p_interval_minutes, p_booking_window_days, p_setup_code
  );

  update public.business_profile
  set theme_style_id = p_theme_style_id, palette_id = p_palette_id, updated_at = now()
  where id = true
  returning * into v_profile;
  return v_profile;
end;
$$;

revoke all on function public.complete_business_onboarding(text, public.business_niche, text, text, text, text, text, text[], jsonb, jsonb, jsonb, integer, integer, text) from public, anon;
grant execute on function public.complete_business_onboarding(text, public.business_niche, text, text, text, text, text, text[], jsonb, jsonb, jsonb, integer, integer, text) to authenticated;

-- Delete an authentication account without exposing privileged API keys.
-- Existing access tokens remain cryptographically valid until expiration, but
-- revoking sessions prevents refresh and profile deletion removes RLS access.
create function public.delete_user_account(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if (select auth.uid()) is null
     or public.auth_role() is distinct from 'owner'::public.user_role then
    raise exception using errcode = '42501', message = 'Somente o proprietário pode excluir contas.';
  end if;

  if p_user_id is null
     or p_user_id = (select auth.uid())
     or exists(select 1 from public.installation_owners where user_id = p_user_id) then
    raise exception using errcode = '42501', message = 'A conta do proprietário não pode ser excluída.';
  end if;

  delete from auth.sessions where user_id = p_user_id;
  delete from auth.users where id = p_user_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'Conta de usuário não encontrada.';
  end if;
end;
$$;

revoke all on function public.delete_user_account(uuid) from public, anon;
grant execute on function public.delete_user_account(uuid) to authenticated;

-- ============================================================================
-- 11. EXPLICIT DATA API PRIVILEGES
-- ============================================================================
-- New Supabase projects no longer grant table access automatically. Reset the
-- browser-role surface first so this schema behaves identically on both old
-- installations with permissive defaults and new installations without them.
-- RLS remains the independent row-level authorization layer in every case.
revoke all on table
  public.profiles,
  public.barbershop_config,
  public.barbers,
  public.services,
  public.bookings,
  public.schedule_blocks,
  public.gallery_photos,
  public.business_profile,
  public.feature_settings,
  public.booking_settings,
  public.booking_services,
  public.installation_owners,
  public.installation_bootstrap,
  public.pets,
  public.pet_notes,
  public.booking_pets
from anon, authenticated;

-- Public visitors may read only the business/catalog configuration. Sensitive
-- professional fields, booking identities and block reasons use safe RPCs.
grant select on table
  public.barbershop_config,
  public.services,
  public.gallery_photos,
  public.business_profile,
  public.feature_settings,
  public.booking_settings
to anon;

-- Authenticated users receive only the operations consumed by the app; RLS
-- and guarded trigger/RPC logic further distinguish owner, staff and customer.
grant select, update on table
  public.profiles,
  public.barbershop_config,
  public.bookings,
  public.business_profile,
  public.feature_settings,
  public.booking_settings
to authenticated;

grant select, insert, update on table public.services to authenticated;
grant insert, update on table public.barbers to authenticated;
grant select (id) on table public.barbers to authenticated;
grant select, insert, delete on table public.schedule_blocks to authenticated;
grant select, insert, update, delete on table public.gallery_photos to authenticated;
grant select on table public.booking_services to authenticated;
grant select, insert, update, delete on table
  public.pets, public.pet_notes, public.booking_pets
to authenticated;

-- Trigger-only helpers do not form part of the browser-accessible API.
revoke all on function public.enforce_booking_customer_identity() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.validate_schedule_block() from public, anon, authenticated;
revoke all on function public.working_hours_are_valid(jsonb) from public, anon, authenticated;
revoke all on function public.validate_working_hours_payload() from public, anon, authenticated;
revoke all on function public.validate_social_links_payload() from public, anon, authenticated;
revoke all on function public.sync_barber_user_link() from public, anon, authenticated;
revoke all on function public.validate_profile_professional_link() from public, anon, authenticated;
revoke all on function public.prevent_profile_privilege_escalation() from public, anon, authenticated;
revoke all on function public.protect_booking_updates() from public, anon, authenticated;
revoke all on function public.prevent_premature_booking_no_show() from public, anon, authenticated;
revoke all on function public.validate_booking_business_rules() from public, anon, authenticated;
revoke all on function public.resolve_working_hours_for_date(jsonb, date, jsonb) from public, anon, authenticated;
revoke all on function public.prevent_booking_schedule_conflicts() from public, anon, authenticated;
revoke all on function public.protect_barber_updates() from public, anon, authenticated;
revoke all on function public.sync_profile_email() from public, anon, authenticated;
revoke all on function public.sync_booking_settings_from_config() from public, anon, authenticated;
revoke all on function public.snapshot_booking_interval() from public, anon, authenticated;
revoke all on function public.sync_booking_service_items() from public, anon, authenticated;
revoke all on function public.touch_updated_at() from public, anon, authenticated;
revoke all on function public.validate_business_profile_payload() from public, anon, authenticated;
revoke all on function public.resolve_legacy_appearance(public.business_niche, text) from public, anon, authenticated;
revoke all on function public.appearance_is_available(public.business_niche, text, text) from public, anon, authenticated;
revoke all on function public.sync_legacy_business_appearance() from public, anon, authenticated;
grant execute on function public.resolve_legacy_appearance(public.business_niche, text) to authenticated;
grant execute on function public.appearance_is_available(public.business_niche, text, text) to authenticated;


-- ============================================================================
-- 12. FINAL PRODUCTION PARITY RECONCILIATION
-- ============================================================================
-- Fresh projects execute only this file. Keep the latest validated production
-- boundaries here as well as in their incremental migrations so an empty
-- installation cannot silently miss a hotfix or a newly introduced contract.

-- Extend the existing branding bucket so the owner can manage both the logo
-- and the public hero cover without introducing another storage provider.
-- Files remain generated WEBP names and mutation stays owner-only.

drop policy if exists "branding_owner_insert" on storage.objects;
create policy "branding_owner_insert" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'branding'
    and public.auth_role() = 'owner'
    and name ~ '^(logos|covers)/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$'
  );

drop policy if exists "branding_owner_update" on storage.objects;
create policy "branding_owner_update" on storage.objects for update to authenticated
  using (bucket_id = 'branding' and public.auth_role() = 'owner')
  with check (
    bucket_id = 'branding'
    and public.auth_role() = 'owner'
    and name ~ '^(logos|covers)/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$'
  );

-- Keep validation helpers private while allowing table updates to invoke them
-- safely through the trigger. The trigger previously ran as SECURITY INVOKER,
-- so authenticated owners hit "permission denied for function
-- working_hours_are_valid" when updating barbershop_config.

create or replace function public.validate_working_hours_payload()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.working_hours is not null
     and not public.working_hours_are_valid(new.working_hours) then
    raise exception using errcode = '23514', message = 'Horário de funcionamento inválido.';
  end if;
  return new;
end;
$$;

-- The helper remains non-public; the trigger executes it with the function
-- owner's privileges instead of exposing a new RPC surface to clients.
revoke all on function public.validate_working_hours_payload() from public, anon, authenticated;
revoke all on function public.working_hours_are_valid(jsonb) from public, anon, authenticated;
grant execute on function public.validate_working_hours_payload() to service_role;
grant execute on function public.working_hours_are_valid(jsonb) to service_role;

-- Allow the Data API to execute the UPDATE path already constrained by RLS.
-- Owners may update any schedule block; professionals may update only their
-- own blocks according to blocks_update_admin_or_own_barber.

grant update on table public.schedule_blocks to authenticated;

-- Separate art direction, brand colours and surface luminosity without
-- breaking installations that still persist/read the legacy theme_id alias.

alter table public.business_profile
  add column if not exists surface_mode text,
  add column if not exists custom_primary_color text,
  add column if not exists custom_secondary_color text,
  add column if not exists custom_accent_color text;

-- Preserve the visual luminosity of the curated palettes that existed before
-- surface mode became independent. Every palette can be changed to either mode
-- after this backfill.
update public.business_profile
set surface_mode = case
  when palette_id in ('graphite', 'navy', 'steel', 'sophisticated_black') then 'dark'
  else 'light'
end
where surface_mode is null;

alter table public.business_profile
  alter column surface_mode set default 'light',
  alter column surface_mode set not null;

alter table public.business_profile
  drop constraint if exists business_profile_palette_id_check,
  drop constraint if exists business_profile_appearance_niche_check,
  drop constraint if exists business_profile_surface_mode_check,
  drop constraint if exists business_profile_custom_primary_color_check,
  drop constraint if exists business_profile_custom_secondary_color_check,
  drop constraint if exists business_profile_custom_accent_color_check,
  drop constraint if exists business_profile_custom_palette_check;

alter table public.business_profile
  add constraint business_profile_palette_id_check check (palette_id in (
    'graphite', 'navy', 'copper', 'forest', 'burgundy', 'steel', 'cream', 'minimal_white', 'contemporary_blue',
    'rose', 'nude', 'champagne', 'lavender', 'sophisticated_black', 'terracotta', 'slate', 'blush', 'vibrant',
    'ocean', 'turquoise', 'soft_yellow', 'coral', 'aqua', 'playful', 'custom'
  )),
  add constraint business_profile_surface_mode_check check (surface_mode in ('light', 'dark')),
  add constraint business_profile_custom_primary_color_check check (
    custom_primary_color is null or custom_primary_color ~ '^#[0-9A-Fa-f]{6}$'
  ),
  add constraint business_profile_custom_secondary_color_check check (
    custom_secondary_color is null or custom_secondary_color ~ '^#[0-9A-Fa-f]{6}$'
  ),
  add constraint business_profile_custom_accent_color_check check (
    custom_accent_color is null or custom_accent_color ~ '^#[0-9A-Fa-f]{6}$'
  ),
  add constraint business_profile_custom_palette_check check (
    (
      palette_id = 'custom'
      and custom_primary_color is not null
      and custom_secondary_color is not null
      and custom_accent_color is not null
    )
    or (
      palette_id <> 'custom'
      and custom_primary_color is null
      and custom_secondary_color is null
      and custom_accent_color is null
    )
  );

create or replace function public.appearance_is_available(
  p_niche_id public.business_niche,
  p_theme_style_id text,
  p_palette_id text
) returns boolean
language sql
immutable
set search_path = public, pg_temp
as $$
  select case p_niche_id
    when 'barbershop' then
      p_theme_style_id in ('modern', 'premium', 'minimal', 'heritage')
      and (p_palette_id = 'custom' or p_palette_id in ('graphite', 'navy', 'copper', 'forest', 'burgundy', 'steel', 'cream', 'minimal_white', 'contemporary_blue'))
    when 'beauty_salon' then
      p_theme_style_id in ('modern', 'premium', 'minimal', 'editorial')
      and (p_palette_id = 'custom' or p_palette_id in ('rose', 'nude', 'champagne', 'lavender', 'burgundy', 'sophisticated_black', 'minimal_white', 'terracotta', 'slate'))
    when 'nail_studio' then
      p_theme_style_id in ('modern', 'premium', 'minimal', 'showcase')
      and (p_palette_id = 'custom' or p_palette_id in ('lavender', 'blush', 'rose', 'nude', 'burgundy', 'minimal_white', 'sophisticated_black', 'champagne', 'vibrant'))
    when 'pet_shop' then
      p_theme_style_id in ('modern', 'clean', 'minimal', 'friendly')
      and (p_palette_id = 'custom' or p_palette_id in ('forest', 'ocean', 'turquoise', 'soft_yellow', 'coral', 'navy', 'aqua', 'minimal_white', 'playful'))
    else false
  end;
$$;

alter table public.business_profile
  add constraint business_profile_appearance_niche_check check (
    public.appearance_is_available(niche_id, theme_style_id, palette_id)
  );

-- Old clients update theme_id only. Keep that compatibility path deterministic:
-- sync the structural style, curated palette and its historical luminosity,
-- and never leave custom colours attached to a legacy write.
create or replace function public.sync_legacy_business_appearance()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_appearance jsonb;
begin
  if tg_op = 'INSERT' then
    if new.theme_style_id is null
       or new.palette_id is null
       or (
         new.theme_style_id = 'minimal'
         and new.palette_id = 'minimal_white'
         and new.theme_id <> 'minimal_light'
       ) then
      v_appearance := public.resolve_legacy_appearance(new.niche_id, new.theme_id);
      new.theme_style_id := v_appearance->>'styleId';
      new.palette_id := v_appearance->>'paletteId';
      new.surface_mode := case
        when new.palette_id in ('graphite', 'navy', 'steel', 'sophisticated_black') then 'dark'
        else 'light'
      end;
      new.custom_primary_color := null;
      new.custom_secondary_color := null;
      new.custom_accent_color := null;
    end if;
  elsif (new.theme_id is distinct from old.theme_id or new.niche_id is distinct from old.niche_id)
        and new.theme_style_id is not distinct from old.theme_style_id
        and new.palette_id is not distinct from old.palette_id then
    v_appearance := public.resolve_legacy_appearance(new.niche_id, new.theme_id);
    new.theme_style_id := v_appearance->>'styleId';
    new.palette_id := v_appearance->>'paletteId';
    new.surface_mode := case
      when new.palette_id in ('graphite', 'navy', 'steel', 'sophisticated_black') then 'dark'
      else 'light'
    end;
    new.custom_primary_color := null;
    new.custom_secondary_color := null;
    new.custom_accent_color := null;
  end if;
  return new;
end;
$$;

comment on column public.business_profile.palette_id is
  'Independent brand colour family. custom stores the owner supplied three-colour identity.';
comment on column public.business_profile.surface_mode is
  'Independent public-site surface luminosity: light or dark.';
comment on column public.business_profile.custom_primary_color is
  'Owner brand primary colour when palette_id=custom.';
comment on column public.business_profile.custom_secondary_color is
  'Owner brand secondary colour when palette_id=custom.';
comment on column public.business_profile.custom_accent_color is
  'Owner brand accent colour when palette_id=custom.';

-- New onboarding overload. Previous signatures remain available so deployments
-- from before this migration continue to complete setup. For a custom palette,
-- bootstrap through a valid curated palette and switch to the custom identity
-- inside the same transaction so the custom-colour constraint is never broken.
create or replace function public.complete_business_onboarding(
  p_business_name text,
  p_niche_id public.business_niche,
  p_theme_id text,
  p_theme_style_id text,
  p_palette_id text,
  p_surface_mode text,
  p_custom_primary_color text,
  p_custom_secondary_color text,
  p_custom_accent_color text,
  p_phone text,
  p_address text,
  p_capabilities text[],
  p_business_hours jsonb,
  p_services jsonb,
  p_professionals jsonb,
  p_interval_minutes integer,
  p_booking_window_days integer,
  p_setup_code text default null
) returns public.business_profile
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile public.business_profile;
  v_bootstrap_palette text;
begin
  if not public.appearance_is_available(p_niche_id, p_theme_style_id, p_palette_id) then
    raise exception using errcode = '23514', message = 'Aparência indisponível para o nicho informado.';
  end if;
  if p_surface_mode not in ('light', 'dark') then
    raise exception using errcode = '23514', message = 'Fundo da aparência inválido.';
  end if;
  if p_palette_id = 'custom' then
    if p_custom_primary_color is null or p_custom_primary_color !~ '^#[0-9A-Fa-f]{6}$'
       or p_custom_secondary_color is null or p_custom_secondary_color !~ '^#[0-9A-Fa-f]{6}$'
       or p_custom_accent_color is null or p_custom_accent_color !~ '^#[0-9A-Fa-f]{6}$' then
      raise exception using errcode = '23514', message = 'Cores personalizadas inválidas.';
    end if;
    v_bootstrap_palette := case p_niche_id
      when 'barbershop' then 'graphite'
      when 'beauty_salon' then 'rose'
      when 'nail_studio' then 'lavender'
      when 'pet_shop' then 'forest'
    end;
  else
    if p_custom_primary_color is not null or p_custom_secondary_color is not null or p_custom_accent_color is not null then
      raise exception using errcode = '23514', message = 'Cores personalizadas só podem ser usadas com a paleta personalizada.';
    end if;
    v_bootstrap_palette := p_palette_id;
  end if;

  select * into v_profile
  from public.complete_business_onboarding(
    p_business_name,
    p_niche_id,
    p_theme_id,
    p_theme_style_id,
    v_bootstrap_palette,
    p_phone,
    p_address,
    p_capabilities,
    p_business_hours,
    p_services,
    p_professionals,
    p_interval_minutes,
    p_booking_window_days,
    p_setup_code
  );

  update public.business_profile
  set theme_id = p_theme_id,
      theme_style_id = p_theme_style_id,
      palette_id = p_palette_id,
      surface_mode = p_surface_mode,
      custom_primary_color = case when p_palette_id = 'custom' then lower(p_custom_primary_color) else null end,
      custom_secondary_color = case when p_palette_id = 'custom' then lower(p_custom_secondary_color) else null end,
      custom_accent_color = case when p_palette_id = 'custom' then lower(p_custom_accent_color) else null end,
      updated_at = now()
  where id = true
  returning * into v_profile;

  return v_profile;
end;
$$;

revoke all on function public.complete_business_onboarding(
  text, public.business_niche, text, text, text, text, text, text, text,
  text, text, text[], jsonb, jsonb, jsonb, integer, integer, text
) from public, anon;
grant execute on function public.complete_business_onboarding(
  text, public.business_niche, text, text, text, text, text, text, text,
  text, text, text[], jsonb, jsonb, jsonb, integer, integer, text
) to authenticated;

-- Keep the legacy admin configuration and the canonical public business
-- identity coherent. Admin Settings still writes barbershop_config during the
-- compatibility window, while BusinessBrand/metadata read business_profile.

create or replace function public.sync_business_profile_from_config()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.business_profile
  set business_name = btrim(new.name),
      phone = nullif(btrim(new.phone), ''),
      whatsapp = nullif(btrim(new.phone), ''),
      address = case
        when nullif(btrim(new.address), '') is null then '{}'::jsonb
        else jsonb_build_object('formatted', btrim(new.address))
      end,
      instagram = nullif(btrim(new.social_links->>'instagram'), ''),
      facebook = nullif(btrim(new.social_links->>'facebook'), '')
  where id = true;
  return new;
end;
$$;

revoke all on function public.sync_business_profile_from_config()
from public, anon, authenticated;
grant execute on function public.sync_business_profile_from_config() to service_role;

drop trigger if exists config_sync_business_profile on public.barbershop_config;
create trigger config_sync_business_profile
after insert or update of name, address, phone, social_links
on public.barbershop_config
for each row execute function public.sync_business_profile_from_config();

-- business_profile is canonical for uploaded branding. Prevent a stale legacy
-- config snapshot from erasing that mirror when Admin Settings saves unrelated
-- fields, then mirror genuine profile logo changes back to compatibility data.
create or replace function public.preserve_canonical_config_logo()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.logo := coalesce((
    select profile.logo_url
    from public.business_profile profile
    where profile.id = true
  ), '');
  return new;
end;
$$;

revoke all on function public.preserve_canonical_config_logo()
from public, anon, authenticated;
grant execute on function public.preserve_canonical_config_logo() to service_role;

drop trigger if exists config_preserve_canonical_logo on public.barbershop_config;
create trigger config_preserve_canonical_logo
before update of logo on public.barbershop_config
for each row execute function public.preserve_canonical_config_logo();

create or replace function public.sync_legacy_config_logo_from_profile()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.barbershop_config
  set logo = coalesce(new.logo_url, '')
  where id = true
    and logo is distinct from coalesce(new.logo_url, '');
  return new;
end;
$$;

revoke all on function public.sync_legacy_config_logo_from_profile()
from public, anon, authenticated;
grant execute on function public.sync_legacy_config_logo_from_profile() to service_role;

drop trigger if exists business_profile_sync_legacy_config_logo on public.business_profile;
create trigger business_profile_sync_legacy_config_logo
after insert or update of logo_url on public.business_profile
for each row execute function public.sync_legacy_config_logo_from_profile();

-- Repair drift that already exists in installations upgraded from the legacy
-- configuration model. These updates intentionally choose the current Admin
-- Settings values for text/contact identity and business_profile for branding.
update public.business_profile profile
set business_name = btrim(config.name),
    phone = nullif(btrim(config.phone), ''),
    whatsapp = nullif(btrim(config.phone), ''),
    address = case
      when nullif(btrim(config.address), '') is null then '{}'::jsonb
      else jsonb_build_object('formatted', btrim(config.address))
    end,
    instagram = nullif(btrim(config.social_links->>'instagram'), ''),
    facebook = nullif(btrim(config.social_links->>'facebook'), '')
from public.barbershop_config config
where profile.id = true
  and config.id = true;

update public.barbershop_config config
set logo = coalesce(profile.logo_url, '')
from public.business_profile profile
where config.id = true
  and profile.id = true
  and config.logo is distinct from coalesce(profile.logo_url, '');

commit;


-- On-demand administrative history queries
-- Bound large administrative history reads to the screen/range that requested them.
-- These RPCs expose only owner-authorized aggregates/rows and keep auth checks
-- inside the database security boundary.

create or replace function public.get_admin_report_bookings(p_start date, p_end date)
returns table (
  id uuid,
  customer_id uuid,
  customer_name text,
  customer_phone text,
  barber_id uuid,
  service_id text,
  date date,
  time time,
  status public.booking_status,
  notes text,
  fee_paid boolean,
  customer_confirmed boolean,
  value numeric,
  created_at timestamptz,
  starts_at timestamptz,
  ends_at timestamptz,
  duration_minutes integer,
  service_items jsonb
)
language plpgsql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
begin
  if auth.uid() is null or public.auth_role() is distinct from 'owner' then
    raise exception using errcode = '42501', message = 'Somente o proprietário pode consultar relatórios administrativos.';
  end if;
  if p_start is null or p_end is null or p_start > p_end then
    raise exception using errcode = '22023', message = 'Período administrativo inválido.';
  end if;

  return query
  select
    booking.id, booking.customer_id, booking.customer_name, booking.customer_phone,
    booking.barber_id, booking.service_id, booking.date, booking.time, booking.status,
    booking.notes, booking.fee_paid, booking.customer_confirmed, booking.value,
    booking.created_at, booking.starts_at, booking.ends_at, booking.duration_minutes,
    coalesce(
      jsonb_agg(jsonb_build_object(
        'serviceId', item.service_id,
        'name', item.name_snapshot,
        'durationMinutes', item.duration_minutes,
        'price', item.price_snapshot
      ) order by item.position) filter (where item.booking_id is not null),
      '[]'::jsonb
    ) as service_items
  from public.bookings booking
  left join public.booking_services item on item.booking_id = booking.id
  where booking.date between p_start and p_end
  group by booking.id
  order by booking.date, booking.time, booking.id;
end;
$$;

create or replace function public.get_admin_client_history_summaries()
returns table (
  customer_id uuid,
  booking_count bigint,
  total_spent numeric,
  last_booking_date date
)
language plpgsql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
begin
  if auth.uid() is null or public.auth_role() is distinct from 'owner' then
    raise exception using errcode = '42501', message = 'Somente o proprietário pode consultar o histórico dos clientes.';
  end if;

  return query
  select
    profile.id as customer_id,
    count(booking.id)::bigint as booking_count,
    coalesce(sum(booking.value) filter (where booking.status = 'Concluído'), 0)::numeric as total_spent,
    max(booking.date) as last_booking_date
  from public.profiles profile
  left join public.bookings booking on booking.customer_id = profile.id
  where profile.role = 'customer'
  group by profile.id
  order by max(booking.date) desc nulls last, profile.id;
end;
$$;

revoke all on function public.get_admin_report_bookings(date, date) from public, anon;
revoke all on function public.get_admin_client_history_summaries() from public, anon;
grant execute on function public.get_admin_report_bookings(date, date) to authenticated;
grant execute on function public.get_admin_client_history_summaries() to authenticated;
