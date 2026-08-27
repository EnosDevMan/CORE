-- Allow the Data API to execute the UPDATE path already constrained by RLS.
-- Owners may update any schedule block; professionals may update only their
-- own blocks according to blocks_update_admin_or_own_barber.
begin;

grant update on table public.schedule_blocks to authenticated;

commit;
