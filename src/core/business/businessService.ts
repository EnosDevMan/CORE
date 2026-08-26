import { supabase } from '../../lib/supabaseClient';
import { NICHE_REGISTRY } from '../../niches/registry';
import type { NicheId } from '../../niches/types';
import { THEME_REGISTRY } from '../../themes/registry';
import type { ThemeId } from '../../themes/types';
import type { BusinessProfile, Capability } from './types';
import { mapBusinessProfile, mapCapabilities } from './runtimeMapper';
import { removePublicImage, uploadImage } from '../../services/storageService';

export interface BusinessRuntime {
  profile: BusinessProfile;
  capabilities: Capability[];
}

let inFlightRuntimeRequest: Promise<BusinessRuntime | null> | null = null;
const BRANDING_BUCKET = 'branding';

async function getCurrentBrandUrls(): Promise<string[]> {
  const { data, error } = await supabase
    .from('business_profile')
    .select('logo_url, favicon_url')
    .eq('id', true)
    .single();
  if (error) throw new Error(error.message);
  return [...new Set([data?.logo_url, data?.favicon_url]
    .filter((value): value is string => typeof value === 'string' && value.length > 0))];
}

async function getCurrentCoverUrl(): Promise<string | undefined> {
  const { data, error } = await supabase
    .from('business_profile')
    .select('cover_url')
    .eq('id', true)
    .single();
  if (error) throw new Error(error.message);
  return typeof data?.cover_url === 'string' && data.cover_url.length > 0
    ? data.cover_url
    : undefined;
}

async function removeStoredBrandingUrl(publicUrl: string | undefined): Promise<void> {
  if (!publicUrl) return;
  try {
    await removePublicImage(publicUrl, BRANDING_BUCKET);
  } catch {
    // External/legacy URLs and an already-removed object must not undo a
    // successful profile update. New uploads are always unique and canonical.
  }
}

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

  async replaceLogo(file: File): Promise<void> {
    const previousUrls = await getCurrentBrandUrls();
    const path = `logos/${crypto.randomUUID()}.webp`;
    const uploadedUrl = await uploadImage(file, path, BRANDING_BUCKET);
    const { error } = await supabase
      .from('business_profile')
      .update({
        logo_url: uploadedUrl,
        favicon_url: uploadedUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', true);

    if (error) {
      await removeStoredBrandingUrl(uploadedUrl);
      throw new Error(error.message);
    }
    await Promise.all(previousUrls
      .filter(previousUrl => previousUrl !== uploadedUrl)
      .map(removeStoredBrandingUrl));
  },

  async removeLogo(): Promise<void> {
    const previousUrls = await getCurrentBrandUrls();
    const { error } = await supabase
      .from('business_profile')
      .update({ logo_url: null, favicon_url: null, updated_at: new Date().toISOString() })
      .eq('id', true);
    if (error) throw new Error(error.message);
    await Promise.all(previousUrls.map(removeStoredBrandingUrl));
  },

  async replaceCover(file: File): Promise<void> {
    const previousUrl = await getCurrentCoverUrl();
    const path = `covers/${crypto.randomUUID()}.webp`;
    const uploadedUrl = await uploadImage(file, path, BRANDING_BUCKET);
    const { error } = await supabase
      .from('business_profile')
      .update({ cover_url: uploadedUrl, updated_at: new Date().toISOString() })
      .eq('id', true);

    if (error) {
      await removeStoredBrandingUrl(uploadedUrl);
      throw new Error(error.message);
    }
    if (previousUrl && previousUrl !== uploadedUrl) {
      await removeStoredBrandingUrl(previousUrl);
    }
  },

  async removeCover(): Promise<void> {
    const previousUrl = await getCurrentCoverUrl();
    const { error } = await supabase
      .from('business_profile')
      .update({ cover_url: null, updated_at: new Date().toISOString() })
      .eq('id', true);
    if (error) throw new Error(error.message);
    await removeStoredBrandingUrl(previousUrl);
  },
};
