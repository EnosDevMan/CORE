-- Regression check for the incremental Data API grant that unlocks the UPDATE
-- operation already protected by blocks_update_admin_or_own_barber RLS.
begin;

do $$
begin
  if not has_table_privilege('authenticated', 'public.schedule_blocks', 'UPDATE') then
    raise exception 'TEST FAILURE: authenticated cannot UPDATE schedule_blocks';
  end if;

  if has_table_privilege('anon', 'public.schedule_blocks', 'UPDATE') then
    raise exception 'TEST FAILURE: anonymous visitor can UPDATE schedule_blocks';
  end if;
end;
$$;

rollback;
