import type { ThemeStyleId } from '../layouts/types';
import { getNichePreset } from '../niches/registry';
import type { NicheId, RuntimeNicheId } from '../niches/types';
import { LEGACY_THEME_APPEARANCE, LEGACY_THEME_ID_BY_PALETTE, PALETTE_IDS } from './compatibility';
import type { LegacyThemeId, PaletteId } from './types';

export interface AppearanceSelection {
  styleId: ThemeStyleId;
  paletteId: PaletteId;
}

const isStyleId = (value: unknown): value is ThemeStyleId =>
  typeof value === 'string' && ['modern', 'premium', 'minimal', 'heritage', 'editorial', 'showcase', 'clean', 'friendly'].includes(value);

const isPaletteId = (value: unknown): value is PaletteId =>
  typeof value === 'string' && PALETTE_IDS.includes(value as PaletteId);

const isLegacyThemeId = (value: unknown): value is LegacyThemeId =>
  typeof value === 'string' && value in LEGACY_THEME_APPEARANCE;

const GRAPHITE_PALETTE_BY_NICHE: Readonly<Record<NicheId, PaletteId>> = {
  barbershop: 'graphite',
  beauty_salon: 'slate',
  nail_studio: 'sophisticated_black',
  pet_shop: 'navy',
};

const legacyAppearanceForNiche = (nicheId: RuntimeNicheId, themeId: LegacyThemeId): AppearanceSelection => {
  if (nicheId === 'core_bootstrap') return LEGACY_THEME_APPEARANCE[themeId];
  const nicheSpecific: Partial<Record<LegacyThemeId, AppearanceSelection>> = {
    graphite_modern: {
      styleId: 'modern',
      paletteId: GRAPHITE_PALETTE_BY_NICHE[nicheId],
    },
    premium_dark: {
      styleId: nicheId === 'pet_shop' ? 'friendly' : 'premium',
      paletteId: nicheId === 'barbershop' ? 'graphite'
        : nicheId === 'pet_shop' ? 'forest'
          : 'sophisticated_black',
    },
    lavender_studio: {
      styleId: nicheId === 'beauty_salon' ? 'editorial' : 'showcase',
      paletteId: 'lavender',
    },
    rose_elegance: {
      styleId: nicheId === 'beauty_salon' ? 'editorial' : 'showcase',
      paletteId: 'rose',
    },
  };
  return nicheSpecific[themeId] ?? LEGACY_THEME_APPEARANCE[themeId];
};

export function isAppearanceAvailableForNiche(
  nicheId: RuntimeNicheId,
  styleId: unknown,
  paletteId: unknown,
): styleId is ThemeStyleId {
  const niche = getNichePreset(nicheId);
  return isStyleId(styleId)
    && isPaletteId(paletteId)
    && niche.availableStyleIds.includes(styleId)
    && niche.availablePaletteIds.includes(paletteId);
}

/** Explicit valid columns win; legacy fills missing values; niche defaults handle invalid IDs. */
export function resolveAppearanceForNiche(
  nicheId: RuntimeNicheId,
  input: { styleId?: unknown; paletteId?: unknown; legacyThemeId?: unknown },
): AppearanceSelection {
  const niche = getNichePreset(nicheId);
  const legacy = isLegacyThemeId(input.legacyThemeId)
    ? legacyAppearanceForNiche(nicheId, input.legacyThemeId)
    : undefined;
  const styleCandidate = isStyleId(input.styleId) ? input.styleId : legacy?.styleId;
  const paletteCandidate = isPaletteId(input.paletteId) ? input.paletteId : legacy?.paletteId;

  return {
    styleId: styleCandidate && niche.availableStyleIds.includes(styleCandidate)
      ? styleCandidate
      : niche.defaultStyleId,
    paletteId: paletteCandidate && niche.availablePaletteIds.includes(paletteCandidate)
      ? paletteCandidate
      : niche.defaultPaletteId,
  };
}

export function getLegacyThemeIdForAppearance(
  nicheId: NicheId,
  styleId: ThemeStyleId,
  paletteId: PaletteId,
): LegacyThemeId {
  const exact = (Object.entries(LEGACY_THEME_APPEARANCE) as Array<[LegacyThemeId, AppearanceSelection]>)
    .find(([, value]) => value.styleId === styleId && value.paletteId === paletteId);
  if (exact) return exact[0];

  const resolved = resolveAppearanceForNiche(nicheId, { styleId, paletteId });
  return LEGACY_THEME_ID_BY_PALETTE[resolved.paletteId];
}
