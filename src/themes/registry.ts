import type { ThemeId, ThemePreset, ThemeTokens } from './types';

const lightBase: ThemeTokens = { background:'#f8fafc', foreground:'#0f172a', surface:'#ffffff', surfaceElevated:'#ffffff', primary:'#1d4ed8', primaryForeground:'#ffffff', secondary:'#e2e8f0', secondaryForeground:'#0f172a', accent:'#f59e0b', accentForeground:'#111827', muted:'#f1f5f9', mutedForeground:'#475569', success:'#15803d', warning:'#b45309', danger:'#b91c1c', border:'#cbd5e1', input:'#ffffff', ring:'#2563eb', radius:'0.75rem', shadow:'0 8px 24px rgb(15 23 42 / 0.10)' };
const preset = (id: ThemeId, name: string, primary: string, accent: string, recommendedNiches: ThemePreset['recommendedNiches'], mode: ThemePreset['mode'] = 'light', primaryForeground = '#ffffff'): ThemePreset => ({ id, name, category: id.startsWith('minimal') || id.startsWith('premium') ? 'universal' : 'niche', mode, recommendedNiches, tokens: { ...lightBase, primary, primaryForeground, accent, ...(mode === 'dark' ? { background:'#09090b', foreground:'#fafafa', surface:'#18181b', surfaceElevated:'#27272a', muted:'#27272a', mutedForeground:'#a1a1aa', border:'#3f3f46', input:'#18181b' } : {}) } });

export const THEME_REGISTRY: Readonly<Record<ThemeId, ThemePreset>> = {
  minimal_light: preset('minimal_light', 'Minimal Light', '#1d4ed8', '#f59e0b', ['barbershop','beauty_salon','nail_studio','pet_shop']),
  premium_dark: preset('premium_dark', 'Premium Dark', '#c9975b', '#d8aa72', ['barbershop','beauty_salon'], 'dark', '#111827'),
  rose_elegance: preset('rose_elegance', 'Rose Elegance', '#be185d', '#f9a8d4', ['beauty_salon','nail_studio']),
  lavender_studio: preset('lavender_studio', 'Lavender Studio', '#7c3aed', '#c4b5fd', ['nail_studio','beauty_salon']),
  forest_clean: preset('forest_clean', 'Forest Clean', '#166534', '#facc15', ['pet_shop']),
};

export const getThemePreset = (id: ThemeId | string): ThemePreset =>
  THEME_REGISTRY[id as ThemeId] ?? THEME_REGISTRY.minimal_light;

export function toCssVariables(theme: ThemePreset): Record<string, string> {
  return Object.fromEntries(Object.entries(theme.tokens).map(([key, value]) => [`--core-${key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`, value]));
}
