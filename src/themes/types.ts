export type ThemeId =
  | 'minimal_light' | 'graphite_modern'
  | 'premium_dark' | 'heritage_copper' | 'urban_steel'
  | 'rose_elegance' | 'champagne_blush' | 'lavender_studio' | 'blush_glass'
  | 'forest_clean' | 'ocean_playful' | 'sunshine_pet';

export type ThemeMode = 'light' | 'dark';

export interface ThemeTokens {
  background: string; foreground: string; surface: string; surfaceElevated: string;
  primary: string; primaryForeground: string; secondary: string; secondaryForeground: string;
  accent: string; accentForeground: string; muted: string; mutedForeground: string;
  success: string; warning: string; danger: string; border: string; input: string; ring: string;
  radius: string; shadow: string;
}

export interface ThemePreset {
  id: ThemeId;
  name: string;
  mode: ThemeMode;
  tokens: ThemeTokens;
}
