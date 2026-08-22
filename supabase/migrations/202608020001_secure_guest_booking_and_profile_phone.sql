-- Additive hardening: guests can never attach another customer's UUID and
-- signup metadata is copied coherently into the public profile.
create or replace function public.enforce_booking_customer_identity()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null and new.customer_id is not null then
    raise exception 'Agendamentos de convidados devem usar customer_id nulo.';
  end if;
  if auth.uid() is not null and public.auth_role() <> 'admin'
     and new.customer_id is distinct from auth.uid() then
    raise exception 'Não é possível criar um agendamento em nome de outro usuário.';
  end if;
  return new;
end;
$$;

drop trigger if exists bookings_enforce_customer_identity on public.bookings;
create trigger bookings_enforce_customer_identity
before insert on public.bookings
for each row execute function public.enforce_booking_customer_identity();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, name, role, phone)
  values (
    new.id,
    new.email,
    coalesce(nullif(btrim(new.raw_user_meta_data->>'name'), ''), new.email),
    'customer',
    nullif(btrim(new.raw_user_meta_data->>'phone'), '')
  );
  return new;
end;
$$;
