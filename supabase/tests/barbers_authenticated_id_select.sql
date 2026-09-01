begin;

do $$
begin
  if has_table_privilege('authenticated', 'public.barbers', 'SELECT') then
    raise exception 'TEST FAILURE: authenticated received full barbers SELECT';
  end if;
  if not has_column_privilege('authenticated', 'public.barbers', 'id', 'SELECT') then
    raise exception 'TEST FAILURE: authenticated cannot read barbers.id for scoped mutations';
  end if;
  if has_column_privilege('authenticated', 'public.barbers', 'user_id', 'SELECT') then
    raise exception 'TEST FAILURE: internal barbers.user_id became directly readable';
  end if;
end $$;

insert into auth.users(id, email, email_confirmed_at, raw_user_meta_data)
values (
  '29000000-0000-4000-8000-000000000001',
  'grant-professional@example.test',
  now(),
  '{"name":"Grant Professional"}'
);
update public.profiles set role = 'professional'
where id = '29000000-0000-4000-8000-000000000001';

insert into public.barbers(id, name, avatar, specialty, active, "order", user_id)
values (
  '29000000-0000-4000-8000-000000000002',
  'Grant Professional', '', 'Teste', true, 9999,
  '29000000-0000-4000-8000-000000000001'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '29000000-0000-4000-8000-000000000001', true);

update public.barbers
set name = 'Grant Professional Updated'
where id = '29000000-0000-4000-8000-000000000002';

reset role;

do $$
begin
  if (select name from public.barbers where id = '29000000-0000-4000-8000-000000000002') <> 'Grant Professional Updated' then
    raise exception 'TEST FAILURE: professional scoped update did not persist';
  end if;
end $$;

rollback;
