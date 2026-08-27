import type { ThemeStyleId, ThemeStyleTokens } from '../layouts/types';

/** Stable persisted IDs from the first theme system. Never remove or rename. */
export type LegacyThemeId =
  | 'minimal_light' | 'graphite_modern'
  | 'premium_dark' | 'heritage_copper' | 'urban_steel'
  | 'rose_elegance' | 'champagne_blush' | 'lavender_studio' | 'blush_glass'
  | 'forest_clean' | 'ocean_playful' | 'sunshine_pet';

/** @deprecated Use LegacyThemeId. Kept while external consumers migrate. */
export type ThemeId = LegacyThemeId;

/** Curated brand families. `custom` is persisted separately as a user selection. */
export type PaletteId =
  | 'graphite' | 'navy' | 'copper' | 'forest' | 'burgundy' | 'steel'
  | 'cream' | 'minimal_white' | 'contemporary_blue'
  | 'rose' | 'nude' | 'champagne' | 'lavender' | 'sophisticated_black'
  | 'terracotta' | 'slate' | 'blush' | 'vibrant'
  | 'ocean' | 'turquoise' | 'soft_yellow' | 'coral' | 'aqua' | 'playful';

export type PaletteSelectionId = PaletteId | 'custom';
export type SurfaceMode = 'light' | 'dark';
/** @deprecated Use SurfaceMode. */
export type ThemeMode = SurfaceMode;

export interface CustomPaletteColors {
  primary: string;
  secondary: string;
  accent: string;
}

/** Brand colours + generated interface surfaces. Functional states stay separate. */
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

/**
 * A curated palette is intentionally just brand identity. Surface/background
 * tokens are generated later from this identity + light/dark mode.
 */
export interface PalettePreset {
  id: PaletteId;
  name: string;
  description: string;
  /** Historical surface used only as a compatibility/default hint. */
  mode: SurfaceMode;
  colors: CustomPaletteColors;
  swatches: readonly [string, string, string];
  /** Closest original preset for clients that still read only theme_id. */
  legacyThemeId: LegacyThemeId;
}

export interface ResolvedTheme {
  id: `${ThemeStyleId}:${PaletteSelectionId}:${SurfaceMode}`;
  styleId: ThemeStyleId;
  paletteId: PaletteSelectionId;
  mode: SurfaceMode;
  customColors?: CustomPaletteColors;
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
