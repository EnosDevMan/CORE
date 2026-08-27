import { getPublicLayoutPreset } from '../layouts/registry';
import type { ThemeStyleId } from '../layouts/types';
import type { NicheId } from '../niches/types';
import { LEGACY_THEME_APPEARANCE } from './compatibility';
import { resolvePaletteTokens } from './paletteMode';
import { getPalettePreset } from './paletteRegistry';
import type {
  CustomPaletteColors,
  LegacyThemeId,
  LegacyThemePreset,
  PaletteSelectionId,
  ResolvedTheme,
  SemanticTokens,
  SurfaceMode,
} from './types';

/** Functional states stay stable regardless of the establishment brand. */
export const SEMANTIC_TOKENS: Readonly<SemanticTokens> = {
  success: '#15803d',
  warning: '#a34f08',
  danger: '#b42318',
  info: '#175cd3',
};

const LEGACY_METADATA: Readonly<Record<LegacyThemeId, { name: string; description: string }>> = {
  minimal_light: { name: 'Minimal Light', description: 'Claro, preciso e silencioso.' },
  graphite_modern: { name: 'Graphite Modern', description: 'Tecnologia discreta e contraste limpo.' },
  premium_dark: { name: 'Premium Dark', description: 'Luxo contemporâneo e presença.' },
  heritage_copper: { name: 'Heritage Copper', description: 'Clássico artesanal em cobre.' },
  urban_steel: { name: 'Urban Steel', description: 'Urbano, energético e geométrico.' },
  rose_elegance: { name: 'Rose Elegance', description: 'Editorial elegante em rosa.' },
  champagne_blush: { name: 'Champagne Blush', description: 'Luxo sereno em tons quentes.' },
  lavender_studio: { name: 'Lavender Studio', description: 'Criativo e delicado em lavanda.' },
  blush_glass: { name: 'Blush Glass', description: 'Vitrine glossy em blush.' },
  forest_clean: { name: 'Forest Clean', description: 'Natural, confiável e calmo.' },
  ocean_playful: { name: 'Ocean Playful', description: 'Fresco, simpático e claro.' },
  sunshine_pet: { name: 'Sunshine Pet', description: 'Quente, alegre e acolhedor.' },
};

export function resolveTheme(
  styleId: ThemeStyleId,
  paletteId: PaletteSelectionId,
  mode?: SurfaceMode,
  customColors?: CustomPaletteColors,
  nicheId?: NicheId,
): ResolvedTheme {
  const style = getPublicLayoutPreset(styleId, nicheId);
  const resolvedMode = mode ?? (paletteId === 'custom' ? 'light' : getPalettePreset(paletteId).mode);
  return {
    id: `${style.id}:${paletteId}:${resolvedMode}`,
    styleId: style.id,
    paletteId,
    mode: resolvedMode,
    customColors: paletteId === 'custom' ? customColors : undefined,
    tokens: {
      ...resolvePaletteTokens(paletteId, resolvedMode, customColors),
      ...style.tokens,
      ...SEMANTIC_TOKENS,
    },
  };
}

const legacyPreset = (legacyId: LegacyThemeId): LegacyThemePreset => {
  const appearance = LEGACY_THEME_APPEARANCE[legacyId];
  const palette = getPalettePreset(appearance.paletteId);
  return {
    ...resolveTheme(appearance.styleId, appearance.paletteId, palette.mode),
    legacyId,
    ...LEGACY_METADATA[legacyId],
  };
};

/** Stable legacy registry retained for old imports and persisted theme_id IDs. */
export const THEME_REGISTRY: Readonly<Record<LegacyThemeId, LegacyThemePreset>> = {
  minimal_light: legacyPreset('minimal_light'),
  graphite_modern: legacyPreset('graphite_modern'),
  premium_dark: legacyPreset('premium_dark'),
  heritage_copper: legacyPreset('heritage_copper'),
  urban_steel: legacyPreset('urban_steel'),
  rose_elegance: legacyPreset('rose_elegance'),
  champagne_blush: legacyPreset('champagne_blush'),
  lavender_studio: legacyPreset('lavender_studio'),
  blush_glass: legacyPreset('blush_glass'),
  forest_clean: legacyPreset('forest_clean'),
  ocean_playful: legacyPreset('ocean_playful'),
  sunshine_pet: legacyPreset('sunshine_pet'),
};

export const getThemePreset = (id: LegacyThemeId | string): LegacyThemePreset =>
  THEME_REGISTRY[id as LegacyThemeId] ?? THEME_REGISTRY.minimal_light;

export { PALETTE_REGISTRY } from './paletteRegistry';
export { LEGACY_THEME_APPEARANCE } from './compatibility';
export { toCssVariables } from './cssVariables';
