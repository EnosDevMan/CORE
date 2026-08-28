-- Bound large administrative history reads to the screen/range that requested them.
-- These RPCs expose only owner-authorized aggregates/rows and keep auth checks
-- inside the database security boundary.

create or replace function public.get_admin_report_bookings(p_start date, p_end date)
returns table (
  id uuid,
  customer_id uuid,
  customer_name text,
  customer_phone text,
  barber_id uuid,
  service_id text,
  date date,
  time time,
  status public.booking_status,
  notes text,
  fee_paid boolean,
  customer_confirmed boolean,
  value numeric,
  created_at timestamptz,
  starts_at timestamptz,
  ends_at timestamptz,
  duration_minutes integer,
  service_items jsonb
)
language plpgsql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
begin
  if auth.uid() is null or public.auth_role() is distinct from 'owner' then
    raise exception using errcode = '42501', message = 'Somente o proprietário pode consultar relatórios administrativos.';
  end if;
  if p_start is null or p_end is null or p_start > p_end then
    raise exception using errcode = '22023', message = 'Período administrativo inválido.';
  end if;

  return query
  select
    booking.id, booking.customer_id, booking.customer_name, booking.customer_phone,
    booking.barber_id, booking.service_id, booking.date, booking.time, booking.status,
    booking.notes, booking.fee_paid, booking.customer_confirmed, booking.value,
    booking.created_at, booking.starts_at, booking.ends_at, booking.duration_minutes,
    coalesce(
      jsonb_agg(jsonb_build_object(
        'serviceId', item.service_id,
        'name', item.name_snapshot,
        'durationMinutes', item.duration_minutes,
        'price', item.price_snapshot
      ) order by item.position) filter (where item.booking_id is not null),
      '[]'::jsonb
    ) as service_items
  from public.bookings booking
  left join public.booking_services item on item.booking_id = booking.id
  where booking.date between p_start and p_end
  group by booking.id
  order by booking.date, booking.time, booking.id;
end;
$$;

create or replace function public.get_admin_client_history_summaries()
returns table (
  customer_id uuid,
  booking_count bigint,
  total_spent numeric,
  last_booking_date date
)
language plpgsql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
begin
  if auth.uid() is null or public.auth_role() is distinct from 'owner' then
    raise exception using errcode = '42501', message = 'Somente o proprietário pode consultar o histórico dos clientes.';
  end if;

  return query
  select
    profile.id as customer_id,
    count(booking.id)::bigint as booking_count,
    coalesce(sum(booking.value) filter (where booking.status = 'Concluído'), 0)::numeric as total_spent,
    max(booking.date) as last_booking_date
  from public.profiles profile
  left join public.bookings booking on booking.customer_id = profile.id
  where profile.role = 'customer'
  group by profile.id
  order by max(booking.date) desc nulls last, profile.id;
end;
$$;

revoke all on function public.get_admin_report_bookings(date, date) from public, anon;
revoke all on function public.get_admin_client_history_summaries() from public, anon;
grant execute on function public.get_admin_report_bookings(date, date) to authenticated;
grant execute on function public.get_admin_client_history_summaries() to authenticated;
