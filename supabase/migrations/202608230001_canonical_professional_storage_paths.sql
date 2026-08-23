-- Canonicalize new avatar objects under professionals/<professional-id>-<suffix>
-- while preserving the legacy namespace during rolling deployments.
begin;

drop policy if exists "avatars_barber_insert_own" on storage.objects;
drop policy if exists "avatars_barber_update_own" on storage.objects;
drop policy if exists "avatars_professional_insert_own" on storage.objects;
drop policy if exists "avatars_professional_update_own" on storage.objects;

create policy "avatars_professional_insert_own" on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and public.auth_role() = 'professional'
    and (
      name like 'professionals/' || (select profile_id::text from public.profiles where id = auth.uid()) || '-%'
      or name like 'barbers/' || (select profile_id::text from public.profiles where id = auth.uid()) || '-%'
    )
  );

create policy "avatars_professional_update_own" on storage.objects for update
  using (
    bucket_id = 'avatars'
    and public.auth_role() = 'professional'
    and (
      name like 'professionals/' || (select profile_id::text from public.profiles where id = auth.uid()) || '-%'
      or name like 'barbers/' || (select profile_id::text from public.profiles where id = auth.uid()) || '-%'
    )
  )
  with check (
    bucket_id = 'avatars'
    and public.auth_role() = 'professional'
    and (
      name like 'professionals/' || (select profile_id::text from public.profiles where id = auth.uid()) || '-%'
      or name like 'barbers/' || (select profile_id::text from public.profiles where id = auth.uid()) || '-%'
    )
  );

commit;
