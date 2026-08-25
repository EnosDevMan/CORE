-- The browser completes installation through complete_business_onboarding().
-- claim_first_owner() is an internal SECURITY DEFINER implementation detail and
-- must not remain directly callable through the Data API.
revoke all on function public.claim_first_owner(text)
  from public, anon, authenticated, service_role;

comment on function public.claim_first_owner(text) is
  'Internal first-owner claim used only by the atomic onboarding RPC. No browser or service-role Data API execute grant.';
