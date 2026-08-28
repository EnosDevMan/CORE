begin;

insert into auth.users(id, email, email_confirmed_at, raw_user_meta_data)
values (
  '25000000-0000-4000-8000-000000000001',
  'history-owner@example.test',
  now(),
  '{"name":"History Owner"}'
);
update public.profiles set role = 'owner' where id = '25000000-0000-4000-8000-000000000001';

do $$ begin
  if has_function_privilege('anon', 'public.get_admin_report_bookings(date,date)', 'EXECUTE')
     or has_function_privilege('anon', 'public.get_admin_client_history_summaries()', 'EXECUTE') then
    raise exception 'TEST FAILURE: anonymous role can execute admin history RPCs';
  end if;
end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '25000000-0000-4000-8000-000000000001', true);

select count(*) from public.get_admin_report_bookings(current_date, current_date);
select count(*) from public.get_admin_client_history_summaries();

rollback;
