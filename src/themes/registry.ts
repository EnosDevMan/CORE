import type { ThemeId, ThemeMode, ThemePreset, ThemeTokens } from './types';

const lightBase: ThemeTokens = {
  background: '#f8fafc', foreground: '#0f172a', surface: '#ffffff', surfaceElevated: '#ffffff',
  primary: '#1d4ed8', primaryForeground: '#ffffff', secondary: '#e2e8f0', secondaryForeground: '#0f172a',
  accent: '#f59e0b', accentForeground: '#111827', muted: '#f1f5f9', mutedForeground: '#475569',
  success: '#15803d', warning: '#b45309', danger: '#b91c1c', border: '#cbd5e1', input: '#ffffff', ring: '#2563eb',
  radius: '0.75rem', shadow: '0 8px 24px rgb(15 23 42 / 0.10)',
};

const darkBase: ThemeTokens = {
  ...lightBase,
  background: '#09090b', foreground: '#fafafa', surface: '#18181b', surfaceElevated: '#27272a',
  secondary: '#27272a', secondaryForeground: '#fafafa', muted: '#27272a', mutedForeground: '#a1a1aa',
  border: '#3f3f46', input: '#18181b', shadow: '0 14px 36px rgb(0 0 0 / 0.28)',
};

const preset = (id: ThemeId, name: string, tokens: Partial<ThemeTokens>, mode: ThemeMode = 'light'): ThemePreset => ({
  id,
  name,
  mode,
  tokens: { ...(mode === 'dark' ? darkBase : lightBase), ...tokens },
});

export const THEME_REGISTRY: Readonly<Record<ThemeId, ThemePreset>> = {
  minimal_light: preset('minimal_light', 'Minimal Light', {
    primary: '#1d4ed8', accent: '#f59e0b', ring: '#2563eb',
  }),
  graphite_modern: preset('graphite_modern', 'Graphite Modern', {
    primary: '#334155', accent: '#38bdf8', ring: '#0284c7', background: '#f7f8fa', muted: '#eef2f6',
  }),
  premium_dark: preset('premium_dark', 'Premium Dark', {
    primary: '#c9975b', primaryForeground: '#111827', accent: '#d8aa72', accentForeground: '#111827', ring: '#d8aa72',
    background: '#0b0d10', surface: '#15191f', surfaceElevated: '#1d232b',
  }, 'dark'),
  heritage_copper: preset('heritage_copper', 'Heritage Copper', {
    primary: '#b66a3c', primaryForeground: '#1a0f09', accent: '#e0b37e', accentForeground: '#24150d', ring: '#d58a55',
    background: '#15100d', surface: '#211915', surfaceElevated: '#2c211b', border: '#4a352a', muted: '#2a211c',
  }, 'dark'),
  urban_steel: preset('urban_steel', 'Urban Steel', {
    primary: '#64748b', accent: '#22d3ee', accentForeground: '#083344', ring: '#22d3ee',
    background: '#0f172a', surface: '#172033', surfaceElevated: '#202c42', border: '#334155', muted: '#1e293b',
  }, 'dark'),
  rose_elegance: preset('rose_elegance', 'Rose Elegance', {
    primary: '#be185d', accent: '#f9a8d4', accentForeground: '#831843', ring: '#db2777',
    background: '#fff7fa', muted: '#fce7f3', border: '#fbcfe8',
  }),
  champagne_blush: preset('champagne_blush', 'Champagne Blush', {
    primary: '#9f5f58', accent: '#d6b36a', accentForeground: '#3b2a16', ring: '#b7796f',
    background: '#fffaf7', muted: '#f7ece8', border: '#ead7cf',
  }),
  lavender_studio: preset('lavender_studio', 'Lavender Studio', {
    primary: '#7c3aed', accent: '#c4b5fd', accentForeground: '#4c1d95', ring: '#8b5cf6',
    background: '#faf7ff', muted: '#f3e8ff', border: '#e9d5ff',
  }),
  blush_glass: preset('blush_glass', 'Blush Glass', {
    primary: '#a855f7', primaryForeground: '#1f0a3d', accent: '#fb7185', accentForeground: '#5f0f2b', ring: '#c084fc',
    background: '#fff7fb', muted: '#fae8ff', border: '#f5d0fe', radius: '1.1rem',
  }),
  forest_clean: preset('forest_clean', 'Forest Clean', {
    primary: '#166534', accent: '#facc15', accentForeground: '#422006', ring: '#15803d',
    background: '#f7faf7', muted: '#eaf4ec', border: '#cfe4d2',
  }),
  ocean_playful: preset('ocean_playful', 'Ocean Playful', {
    primary: '#0369a1', accent: '#22c55e', accentForeground: '#052e16', ring: '#0284c7',
    background: '#f0f9ff', muted: '#e0f2fe', border: '#bae6fd', radius: '1rem',
  }),
  sunshine_pet: preset('sunshine_pet', 'Sunshine Pet', {
    primary: '#c2410c', accent: '#facc15', accentForeground: '#422006', ring: '#ea580c',
    background: '#fffaf0', muted: '#ffedd5', border: '#fed7aa', radius: '1rem',
  }),
};

export const getThemePreset = (id: ThemeId | string): ThemePreset =>
  THEME_REGISTRY[id as ThemeId] ?? THEME_REGISTRY.minimal_light;

export function toCssVariables(theme: ThemePreset): Record<string, string> {
  return Object.fromEntries(Object.entries(theme.tokens).map(([key, value]) => [
    `--core-${key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`,
    value,
  ]));
}
