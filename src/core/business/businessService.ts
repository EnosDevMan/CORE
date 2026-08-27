import { supabase } from '../../lib/supabaseClient';
import type { ThemeStyleId } from '../../layouts/types';
import type { NicheId } from '../../niches/types';
import { getLegacyThemeIdForAppearance, isAppearanceAvailableForNiche, resolveAppearanceForNiche } from '../../themes/appearance';
import { LEGACY_THEME_APPEARANCE } from '../../themes/compatibility';
import { normalizeCustomPalette } from '../../themes/paletteMode';
import { getPalettePreset } from '../../themes/paletteRegistry';
import type {
  CustomPaletteColors,
  LegacyThemeId,
  PaletteSelectionId,
  ResolvedTheme,
  SurfaceMode,
} from '../../themes/types';
import type { BusinessProfile, Capability } from './types';
import { mapBusinessProfile, mapCapabilities } from './runtimeMapper';
import { removePublicImage, uploadImage } from '../../services/storageService';

export interface BusinessRuntime {
  profile: BusinessProfile;
  capabilities: Capability[];
  theme?: ResolvedTheme;
}

export interface AppearanceUpdate {
  styleId: ThemeStyleId;
  paletteId: PaletteSelectionId;
  surfaceMode?: SurfaceMode;
  customColors?: CustomPaletteColors;
}

let inFlightRuntimeRequest: Promise<BusinessRuntime | null> | null = null;
let recentRuntime: { value: BusinessRuntime | null; expiresAt: number } | null = null;
const RUNTIME_BOOTSTRAP_CACHE_MS = 15_000;
const BRANDING_BUCKET = 'branding';

const invalidateRuntimeCache = () => {
  recentRuntime = null;
};

const defaultSurfaceMode = (paletteId: PaletteSelectionId): SurfaceMode =>
  paletteId === 'custom' ? 'light' : getPalettePreset(paletteId).mode;

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
  const profile = mapBusinessProfile(profileResult.data);
  const { resolveTheme } = await import('../../themes/registry');
  return {
    profile,
    capabilities: mapCapabilities(featuresResult.data ?? []),
    theme: resolveTheme(
      profile.themeStyleId,
      profile.paletteId,
      profile.surfaceMode,
      profile.customPalette,
      profile.nicheId as NicheId,
    ),
  };
}

export const businessService = {
  /** Deduplicates the runtime bootstrap between the public boundary and data loader. */
  getRuntime(): Promise<BusinessRuntime | null> {
    if (recentRuntime && recentRuntime.expiresAt > Date.now()) {
      return Promise.resolve(recentRuntime.value);
    }

    if (!inFlightRuntimeRequest) {
      inFlightRuntimeRequest = fetchRuntime()
        .then(value => {
          recentRuntime = {
            value,
            expiresAt: Date.now() + RUNTIME_BOOTSTRAP_CACHE_MS,
          };
          return value;
        })
        .finally(() => {
          inFlightRuntimeRequest = null;
        });
    }
    return inFlightRuntimeRequest;
  },

  async updateAppearance(
    selection: AppearanceUpdate,
    nicheId: BusinessProfile['nicheId'],
  ): Promise<void> {
    if (nicheId === 'core_bootstrap') throw new Error('O negócio ainda não foi configurado.');
    const persistedNicheId = nicheId as NicheId;
    if (!isAppearanceAvailableForNiche(persistedNicheId, selection.styleId, selection.paletteId)) {
      throw new Error('Esta combinação visual não está disponível para o nicho configurado.');
    }

    const surfaceMode = selection.surfaceMode ?? defaultSurfaceMode(selection.paletteId);
    if (surfaceMode !== 'light' && surfaceMode !== 'dark') {
      throw new Error('Escolha um fundo claro ou escuro.');
    }

    const customColors = selection.paletteId === 'custom'
      ? normalizeCustomPalette(selection.customColors)
      : undefined;
    if (selection.paletteId === 'custom' && !customColors) {
      throw new Error('A paleta personalizada precisa de três cores hexadecimais válidas.');
    }

    const themeId = getLegacyThemeIdForAppearance(persistedNicheId, selection.styleId, selection.paletteId);

    const { error } = await supabase
      .from('business_profile')
      .update({
        theme_id: themeId,
        theme_style_id: selection.styleId,
        palette_id: selection.paletteId,
        surface_mode: surfaceMode,
        custom_primary_color: customColors?.primary ?? null,
        custom_secondary_color: customColors?.secondary ?? null,
        custom_accent_color: customColors?.accent ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', true);
    if (error) throw new Error(error.message);
    invalidateRuntimeCache();
  },

  /** @deprecated Compatibility path for consumers still sending a theme_id. */
  async updateTheme(themeId: LegacyThemeId, nicheId: BusinessProfile['nicheId']): Promise<void> {
    if (!(themeId in LEGACY_THEME_APPEARANCE)) throw new Error('Tema visual desconhecido.');
    if (nicheId === 'core_bootstrap') throw new Error('O negócio ainda não foi configurado.');
    const persistedNicheId = nicheId as NicheId;
    const selection = resolveAppearanceForNiche(persistedNicheId, { legacyThemeId: themeId });
    await businessService.updateAppearance({
      ...selection,
      surfaceMode: defaultSurfaceMode(selection.paletteId),
    }, persistedNicheId);
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
    invalidateRuntimeCache();
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
    invalidateRuntimeCache();
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
    invalidateRuntimeCache();
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
    invalidateRuntimeCache();
    await removeStoredBrandingUrl(previousUrl);
  },
};
