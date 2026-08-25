begin;

create or replace function public.prevent_premature_booking_no_show()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status = 'Não compareceu'
     and new.status is distinct from old.status
     and old.starts_at > now() then
    raise exception 'Não é possível registrar ausência antes do início do horário reservado.';
  end if;
  return new;
end;
$$;

drop trigger if exists bookings_prevent_premature_no_show on public.bookings;
create trigger bookings_prevent_premature_no_show
before update of status on public.bookings
for each row execute function public.prevent_premature_booking_no_show();

revoke all on function public.prevent_premature_booking_no_show() from public, anon, authenticated;

commit;
