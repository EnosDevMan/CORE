-- Corrige: o barbeiro não conseguia trocar a própria foto em "Meu Perfil".
--
-- A trigger `protect_barber_updates` já permitia gravar a coluna `avatar`
-- na tabela `barbers` quando o próprio barbeiro faz a alteração. O upload
-- do arquivo, porém, falhava antes disso: o bucket 'avatars' só tinha
-- policies de insert/update/delete para admin (avatars_admin_write/
-- update/delete), então `supabase.storage.from('avatars').upload(...)`
-- feito pelo barbeiro (BarberProfileEditModal -> uploadImage) sempre
-- era barrado pelo RLS do Storage.
--
-- `supabase/schema.sql` (bootstrap de projeto novo) já documenta a
-- solução — as duas policies abaixo, linha por linha idênticas às de lá —
-- mas schema.sql só é aplicado em projeto vazio; bancos já existentes só
-- recebem mudanças via migration, e esta nunca tinha sido criada. Esta
-- migration só traz o banco atual para o mesmo estado que schema.sql já
-- descreve, nada além disso.
--
-- Segurança e escopo:
--   - Cada barbeiro só grava dentro do próprio namespace
--     `barbers/{profiles.profile_id}-...` (profile_id aponta para
--     barbers.id quando role = 'barber'); não é possível escrever no
--     arquivo de outro barbeiro.
--   - Puramente aditivo: policies permissivas se combinam por OR, então
--     as policies de admin (avatars_admin_write/update/delete) continuam
--     valendo exatamente como antes — nenhuma policy existente é
--     alterada, removida ou tem seu comportamento restringido.
--   - Não mexe no bucket 'gallery' nem em nenhuma outra tabela/trigger.
--   - Não adiciona delete: o fluxo do barbeiro nunca remove a foto
--     antiga (o path já inclui timestamp), então delete não é necessário
--     — mantendo o mesmo escopo mínimo que já está em schema.sql.
--   - Idempotente (drop + create), para poder rodar em qualquer branch/
--     preview sem quebrar caso a policy já exista.
begin;

drop policy if exists "avatars_barber_insert_own" on storage.objects;
create policy "avatars_barber_insert_own" on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth_role() = 'barber'
    and name like 'barbers/' || (select profile_id::text from profiles where id = auth.uid()) || '-%'
  );

drop policy if exists "avatars_barber_update_own" on storage.objects;
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

commit;
