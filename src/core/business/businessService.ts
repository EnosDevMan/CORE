import { supabase } from '../../lib/supabaseClient';
import type { BusinessProfile, Capability } from './types';
import { mapBusinessProfile, mapCapabilities } from './runtimeMapper';

export interface BusinessRuntime {
  profile: BusinessProfile;
  capabilities: Capability[];
}

let inFlightRuntimeRequest: Promise<BusinessRuntime | null> | null = null;

async function fetchRuntime(): Promise<BusinessRuntime | null> {
  const [profileResult, featuresResult] = await Promise.all([
    supabase.from('business_profile').select('*').eq('id', true).maybeSingle(),
    supabase.from('feature_settings').select('capability').eq('enabled', true),
  ]);
  if (profileResult.error) throw new Error(profileResult.error.message);
  if (featuresResult.error) throw new Error(featuresResult.error.message);
  if (!profileResult.data?.onboarding_completed) return null;
  return {
    profile: mapBusinessProfile(profileResult.data),
    capabilities: mapCapabilities(featuresResult.data ?? []),
  };
}

export const businessService = {
  /**
   * Deduplicates concurrent bootstrap reads without caching the result beyond
   * the active request. Later calls still observe changes made to the business.
   */
  getRuntime(): Promise<BusinessRuntime | null> {
    if (!inFlightRuntimeRequest) {
      inFlightRuntimeRequest = fetchRuntime().finally(() => {
        inFlightRuntimeRequest = null;
      });
    }
    return inFlightRuntimeRequest;
  },
};
