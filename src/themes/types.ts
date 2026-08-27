import type { ThemeStyleId, ThemeStyleTokens } from '../layouts/types';

/** Stable persisted IDs from the first theme system. Never remove or rename. */
export type LegacyThemeId =
  | 'minimal_light' | 'graphite_modern'
  | 'premium_dark' | 'heritage_copper' | 'urban_steel'
  | 'rose_elegance' | 'champagne_blush' | 'lavender_studio' | 'blush_glass'
  | 'forest_clean' | 'ocean_playful' | 'sunshine_pet';

/** @deprecated Use LegacyThemeId. Kept while external consumers migrate. */
export type ThemeId = LegacyThemeId;

export type PaletteId =
  | 'graphite' | 'navy' | 'copper' | 'forest' | 'burgundy' | 'steel'
  | 'cream' | 'minimal_white' | 'contemporary_blue'
  | 'rose' | 'nude' | 'champagne' | 'lavender' | 'sophisticated_black'
  | 'terracotta' | 'slate' | 'blush' | 'vibrant'
  | 'ocean' | 'turquoise' | 'soft_yellow' | 'coral' | 'aqua' | 'playful';

export type ThemeMode = 'light' | 'dark';

/** Brand colours. Functional states intentionally live outside palettes. */
export interface PaletteTokens {
  background: string;
  canvas: string;
  foreground: string;
  surface: string;
  surfaceElevated: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  input: string;
  ring: string;
  decorative: string;
  decorativeForeground: string;
  nav: string;
  navForeground: string;
  heroGradient: string;
  surfaceGradient: string;
  cardBackground: string;
  cardBorder: string;
  cta: string;
  ctaForeground: string;
}

export interface SemanticTokens {
  success: string;
  warning: string;
  danger: string;
  info: string;
}

export interface ThemeTokens extends PaletteTokens, ThemeStyleTokens, SemanticTokens {}

export interface PalettePreset {
  id: PaletteId;
  name: string;
  description: string;
  mode: ThemeMode;
  swatches: readonly [string, string, string, string];
  /** Closest original preset for clients that still read only theme_id. */
  legacyThemeId: LegacyThemeId;
  tokens: PaletteTokens;
}

export interface ResolvedTheme {
  id: `${ThemeStyleId}:${PaletteId}`;
  styleId: ThemeStyleId;
  paletteId: PaletteId;
  mode: ThemeMode;
  tokens: ThemeTokens;
}

/** Compatibility shape for code that still presents the original presets. */
export interface LegacyThemePreset extends ResolvedTheme {
  legacyId: LegacyThemeId;
  name: string;
  description: string;
}

/** @deprecated Use ResolvedTheme. */
export type ThemePreset = LegacyThemePreset;
