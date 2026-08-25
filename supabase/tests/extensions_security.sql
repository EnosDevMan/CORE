-- Keep extension-owned objects out of the API-exposed public schema.
do $$
declare
  v_schema text;
begin
  select n.nspname into v_schema
  from pg_extension e
  join pg_namespace n on n.oid = e.extnamespace
  where e.extname = 'btree_gist';

  if v_schema is null then
    raise exception 'TEST FAILURE: btree_gist extension is missing';
  end if;

  if v_schema <> 'extensions' then
    raise exception 'TEST FAILURE: btree_gist must live in extensions, found %', v_schema;
  end if;
end;
$$;
