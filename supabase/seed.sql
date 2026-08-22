-- ============================================================================
-- Seed opcional — dados de exemplo para testar um projeto novo.
-- Rode depois das migrations. Não inclui usuários (contas vêm sempre do
-- cadastro real via Supabase Auth) nem agendamentos (começam vazios).
-- ============================================================================

update barbershop_config set
  name = 'Paulo Gledson Barbearia',
  logo = 'scissors',
  address = 'Av. Exemplo, 1000 - Bairro, Cidade - UF',
  phone = '(11) 99999-9999',
  working_hours = '{"open":"08:00","close":"19:00","daysOpen":[2,3,4,5,6]}',
  social_links = '{"instagram":"https://instagram.com/barbearia_exemplo","facebook":"https://facebook.com/barbearia_exemplo","whatsapp":"https://wa.me/11999999999"}',
  booking_fee = 10.0,
  tolerance_minutes = 15,
  interval_minutes = 30,
  booking_window_days = 3,
  pix_key = '11999999999',
  hero_title = 'PAULO GLEDSON',
  hero_subtitle = 'Tradição e Estilo em Sua Cidade',
  hero_description = 'Mais que um corte de cabelo, uma experiência de autocuidado e alta performance. Agende seu horário com os maiores especialistas da região em poucos cliques.',
  about_text = 'Cortes, barba e cuidado masculino com atendimento profissional, qualidade e atenção aos detalhes.'
where id = true;

insert into barbers (name, avatar, specialty, active, "order") values
  ('Paulo Gledson', '', 'Cortes Artísticos, Visagismo, Especialista e Proprietário', true, 0),
  ('Murilo Costa', '', 'Cortes Clássicos, Degradê Moderno e Barba', true, 1);

insert into services (name, duration, price, description, category, "order") values
  ('Corte Degradê (Fade)', 45, 44.90, 'Degradê moderno e sombreado de alto padrão para um visual marcante.', 'Cabelo', 0),
  ('Corte Navalhado', 50, 44.90, 'Acabamento ultra rente na navalha com máxima definição das linhas.', 'Cabelo', 1),
  ('Corte na Tesoura', 50, 49.90, 'Corte artesanal feito 100% na tesoura para um caimento natural.', 'Cabelo', 2),
  ('Corte Tradicional', 35, 44.90, 'Corte social clássico e alinhado para todas as ocasiões.', 'Cabelo', 3),
  ('Corte Militar', 30, 44.90, 'Corte curto, prático e higiênico com alta durabilidade.', 'Cabelo', 4),
  ('Corte Infantil (Kids)', 35, 49.90, 'Atendimento alegre, paciente e com muito estilo para os pequenos.', 'Cabelo', 5),
  ('Corte Número Único', 25, 34.90, 'Raspado clássico uniforme feito com um único pente de máquina.', 'Cabelo', 6),
  ('Barba de Respeito', 35, 34.90, 'Modelagem, alinhamento e acabamento preciso da barba.', 'Barba', 7),
  ('Pigmentação Capilar / Barba', 30, 34.90, 'Sombreamento impecável para corrigir falhas e destacar contornos.', 'Estética', 8),
  ('Sobrancelha na Navalha', 15, 19.90, 'Design limpo e alinhado feito na lâmina com alta precisão.', 'Estética', 9),
  ('Freestyle (Arte no Cabelo)', 20, 9.90, 'Riscos, listras e desenhos personalizados feitos à mão livre.', 'Estética', 10);

-- Para promover um usuário já cadastrado (via tela de Cadastro) a admin ou
-- barbeiro, rode manualmente algo como:
--   update profiles set role = 'admin' where email = 'seu-email@exemplo.com';
