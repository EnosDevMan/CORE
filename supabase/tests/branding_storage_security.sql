-- Branding upload authorization and bucket contract.
begin;

do $$
begin
  if not exists (
    select 1 from storage.buckets
    where id = 'branding'
      and public
      and file_size_limit = 5242880
      and allowed_mime_types @> array['image/jpeg', 'image/png', 'image/webp']
  ) then
    raise exception 'TEST FAILURE: branding bucket limits are not production-safe';
  end if;
end;
$$;

insert into auth.users(id, email, email_confirmed_at, raw_user_meta_data)
values
  ('20000000-0000-4000-8000-000000000001', 'brand-owner@example.test', now(), '{"name":"Brand Owner"}'),
  ('20000000-0000-4000-8000-000000000002', 'brand-customer@example.test', now(), '{"name":"Brand Customer"}');

update public.profiles
set role = 'owner'
where id = '20000000-0000-4000-8000-000000000001';

set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000001', true);

insert into storage.objects(bucket_id, name)
values ('branding', 'logos/20000000-0000-4000-8000-000000000003.webp');

do $$
begin
  begin
    insert into storage.objects(bucket_id, name)
    values ('branding', 'arbitrary/not-a-generated-logo.png');
    raise exception 'TEST FAILURE: owner bypassed the canonical logo path';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

set local role anon;
select set_config('request.jwt.claim.sub', '', true);

do $$
begin
  if not exists (
    select 1 from storage.objects
    where bucket_id = 'branding'
      and name = 'logos/20000000-0000-4000-8000-000000000003.webp'
  ) then
    raise exception 'TEST FAILURE: public branding asset is not readable';
  end if;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000002', true);

do $$
begin
  begin
    insert into storage.objects(bucket_id, name)
    values ('branding', 'logos/20000000-0000-4000-8000-000000000004.webp');
    raise exception 'TEST FAILURE: customer uploaded a business logo';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

delete from storage.objects
where bucket_id = 'branding'
  and name = 'logos/20000000-0000-4000-8000-000000000003.webp';

select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000001', true);

do $$
begin
  if not exists (
    select 1 from storage.objects
    where bucket_id = 'branding'
      and name = 'logos/20000000-0000-4000-8000-000000000003.webp'
  ) then
    raise exception 'TEST FAILURE: customer deleted the business logo';
  end if;
end;
$$;

delete from storage.objects
where bucket_id = 'branding'
  and name = 'logos/20000000-0000-4000-8000-000000000003.webp';

rollback;
