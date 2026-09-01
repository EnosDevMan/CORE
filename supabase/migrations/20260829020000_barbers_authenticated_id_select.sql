-- Existing installations can predate the consolidated schema's column-level
-- SELECT grant on barbers.id. UPDATE ... WHERE id = ... and INSERT/UPDATE
-- requests returning only `id` need that column privilege even though the
-- remaining physical barber row stays hidden behind safe RPC projections.
--
-- Keep the grant deliberately column-scoped: user_id and the other physical
-- columns remain unavailable through direct browser SELECTs.
grant select (id) on table public.barbers to authenticated;
