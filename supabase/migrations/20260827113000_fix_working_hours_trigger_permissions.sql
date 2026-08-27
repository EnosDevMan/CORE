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
