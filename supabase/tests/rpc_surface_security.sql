-- Regression test: privileged implementation helpers must not be browser RPCs.
begin;

do $$
begin
  if has_function_privilege('anon', 'public.claim_first_owner(text)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.claim_first_owner(text)', 'EXECUTE')
     or has_function_privilege('service_role', 'public.claim_first_owner(text)', 'EXECUTE') then
    raise exception 'TEST FAILURE: claim_first_owner is directly executable outside its definer-owned onboarding flow';
  end if;

  if not has_function_privilege(
    'authenticated',
    'public.complete_business_onboarding(text,public.business_niche,text,text,text,text[],jsonb,jsonb,jsonb,integer,integer,text)',
    'EXECUTE'
  ) then
    raise exception 'TEST FAILURE: the public authenticated onboarding contract lost EXECUTE permission';
  end if;

  -- auth_role is intentionally an RLS helper used by browser-role policies.
  -- It takes no input and only resolves the current caller's role, so it stays
  -- executable while privileged mutation helpers remain internal.
  if not has_function_privilege('authenticated', 'public.auth_role()', 'EXECUTE') then
    raise exception 'TEST FAILURE: auth_role RLS helper is not executable by authenticated policies';
  end if;
end;
$$;

rollback;
