export type ThemeId =
  | 'minimal_light' | 'graphite_modern'
  | 'premium_dark' | 'heritage_copper' | 'urban_steel'
  | 'rose_elegance' | 'champagne_blush' | 'lavender_studio' | 'blush_glass'
  | 'forest_clean' | 'ocean_playful' | 'sunshine_pet';

export type ThemeMode = 'light' | 'dark';

export type ThemePersonality =
  | 'minimal' | 'editorial' | 'heritage' | 'industrial'
  | 'romantic' | 'soft_luxury' | 'creative' | 'glass'
  | 'organic' | 'playful' | 'sunny';

export interface ThemeTokens {
  background: string; canvas: string; foreground: string; surface: string; surfaceElevated: string;
  primary: string; primaryForeground: string; secondary: string; secondaryForeground: string;
  accent: string; accentForeground: string; muted: string; mutedForeground: string;
  success: string; warning: string; danger: string; border: string; input: string; ring: string;
  decorative: string; decorativeForeground: string; nav: string; navForeground: string;
  fontBody: string; fontDisplay: string; headingTracking: string;
  radius: string; cardRadius: string; buttonRadius: string;
  shadow: string; shadowStrong: string; heroGradient: string; surfaceGradient: string; pattern: string;
}

export interface ThemePreset {
  id: ThemeId;
  name: string;
  description: string;
  personality: ThemePersonality;
  mode: ThemeMode;
  tokens: ThemeTokens;
}
