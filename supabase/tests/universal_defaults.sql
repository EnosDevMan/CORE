-- Regression test: a fresh CORE installation must not inherit a barbershop identity.
begin;

do $$
declare
  v_default text;
  v_table_comment text;
begin
  select column_default
    into v_default
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'barbershop_config'
    and column_name = 'name';

  if v_default is null or v_default not like '%CORE%' then
    raise exception 'TEST FAILURE: barbershop_config.name default is not the neutral CORE identity: %', v_default;
  end if;

  if lower(v_default) like '%barbearia%' then
    raise exception 'TEST FAILURE: legacy barbershop identity leaked into the fresh-install default: %', v_default;
  end if;

  select obj_description('public.barbershop_config'::regclass, 'pg_class')
    into v_table_comment;

  if v_table_comment is null or v_table_comment not like '%Legacy physical compatibility%' then
    raise exception 'TEST FAILURE: legacy physical table is not documented as a compatibility boundary';
  end if;
end;
$$;

rollback;
