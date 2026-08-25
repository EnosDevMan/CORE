import { supabase } from '../../lib/supabaseClient';
import { NICHE_REGISTRY } from '../../niches/registry';
import type { NicheId } from '../../niches/types';
import { THEME_REGISTRY } from '../../themes/registry';
import type { ThemeId } from '../../themes/types';
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

  async updateTheme(themeId: ThemeId, nicheId: BusinessProfile['nicheId']): Promise<void> {
    if (!THEME_REGISTRY[themeId]) throw new Error('Tema visual desconhecido.');
    if (nicheId === 'core_bootstrap') throw new Error('O negócio ainda não foi configurado.');

    const niche = NICHE_REGISTRY[nicheId as NicheId];
    if (!niche.recommendedThemeIds.includes(themeId)) {
      throw new Error('Este tema não está disponível para o nicho configurado.');
    }

    const { error } = await supabase
      .from('business_profile')
      .update({ theme_id: themeId, updated_at: new Date().toISOString() })
      .eq('id', true);
    if (error) throw new Error(error.message);
  },
};
