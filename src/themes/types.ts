import type { NicheId } from '../niches/types';

export type ThemeId = 'minimal_light' | 'premium_dark' | 'rose_elegance' | 'lavender_studio' | 'forest_clean';
export type ThemeMode = 'light' | 'dark';

export interface ThemeTokens {
  background: string; foreground: string; surface: string; surfaceElevated: string;
  primary: string; primaryForeground: string; secondary: string; secondaryForeground: string;
  accent: string; accentForeground: string; muted: string; mutedForeground: string;
  success: string; warning: string; danger: string; border: string; input: string; ring: string;
  radius: string; shadow: string;
}

export interface ThemePreset {
  id: ThemeId; name: string; category: 'universal' | 'niche'; mode: ThemeMode;
  recommendedNiches: readonly NicheId[]; tokens: ThemeTokens;
}
