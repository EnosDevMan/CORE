-- ============================================================================
-- Seed opcional — dados de exemplo para testar um projeto novo.
-- Rode depois das migrations. Não inclui usuários (contas vêm sempre do
-- cadastro real via Supabase Auth) nem agendamentos (começam vazios).
-- ============================================================================

update barbershop_config set
  name = 'Negócio Demo',
  logo = 'scissors',
  address = 'Av. Exemplo, 1000 - Bairro, Cidade - UF',
  phone = '(11) 99999-9999',
  working_hours = '{"open":"08:00","close":"19:00","daysOpen":[2,3,4,5,6]}',
  social_links = '{}',
  booking_fee = 10.0,
  tolerance_minutes = 15,
  interval_minutes = 30,
  booking_window_days = 3,
  pix_key = null,
  hero_title = 'AGENDE SEU HORÁRIO',
  hero_subtitle = 'Atendimento profissional perto de você',
  hero_description = 'Escolha um serviço, profissional e horário disponível.',
  about_text = 'Dados exclusivamente fictícios para desenvolvimento local.'
where id = true;

insert into barbers (name, avatar, specialty, active, "order")
select 'Profissional Demo', '', 'Serviços gerais', true, 0
where not exists (select 1 from barbers where name = 'Profissional Demo');

insert into services (name, duration, price, description, category, "order")
select 'Serviço Demo', 30, 50.00, 'Serviço fictício e editável.', 'Geral', 0
where not exists (select 1 from services where name = 'Serviço Demo');

-- Não promova usuários manualmente. O primeiro proprietário deve usar o fluxo
-- seguro `claim_first_owner`; profissionais são vinculados pelo painel após o
-- onboarding.
