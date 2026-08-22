-- Canonicalize application roles without changing enum value OIDs. PostgreSQL
-- updates stored enum constants in functions, triggers and RLS policies when a
-- value is renamed, so existing authorization behavior remains intact.
begin;

alter type public.user_role rename value 'admin' to 'owner';
alter type public.user_role rename value 'barber' to 'professional';
alter type public.user_role add value if not exists 'manager' after 'owner';
alter type public.user_role add value if not exists 'receptionist' before 'professional';

commit;
