import type { ThemeId, ThemePreset, ThemeTokens } from './types';

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

function preset(
  id: ThemeId,
  name: string,
  description: string,
  recommendedNiches: ThemePreset['recommendedNiches'],
  tokens: Partial<ThemeTokens>,
  options: { mode?: ThemePreset['mode']; category?: ThemePreset['category'] } = {},
): ThemePreset {
  const mode = options.mode ?? 'light';
  return {
    id,
    name,
    description,
    category: options.category ?? 'niche',
    mode,
    recommendedNiches,
    tokens: { ...(mode === 'dark' ? darkBase : lightBase), ...tokens },
  };
}

export const THEME_REGISTRY: Readonly<Record<ThemeId, ThemePreset>> = {
  minimal_light: preset(
    'minimal_light', 'Minimal Light', 'Neutro, limpo e versátil para qualquer operação.',
    ['barbershop', 'beauty_salon', 'nail_studio', 'pet_shop'],
    { primary: '#1d4ed8', accent: '#f59e0b', ring: '#2563eb' },
    { category: 'universal' },
  ),
  graphite_modern: preset(
    'graphite_modern', 'Graphite Modern', 'Cinzas sofisticados com destaque azul, visual corporativo e contemporâneo.',
    ['barbershop', 'beauty_salon', 'nail_studio', 'pet_shop'],
    { primary: '#334155', accent: '#38bdf8', ring: '#0284c7', background: '#f7f8fa', muted: '#eef2f6' },
    { category: 'universal' },
  ),
  premium_dark: preset(
    'premium_dark', 'Premium Dark', 'Escuro premium com metais quentes e contraste marcante.',
    ['barbershop', 'beauty_salon'],
    { primary: '#c9975b', primaryForeground: '#111827', accent: '#d8aa72', accentForeground: '#111827', ring: '#d8aa72', background: '#0b0d10', surface: '#15191f', surfaceElevated: '#1d232b' },
    { mode: 'dark' },
  ),
  heritage_copper: preset(
    'heritage_copper', 'Heritage Copper', 'Cobre, couro e tons terrosos para uma identidade clássica e artesanal.',
    ['barbershop'],
    { primary: '#b66a3c', primaryForeground: '#1a0f09', accent: '#e0b37e', accentForeground: '#24150d', ring: '#d58a55', background: '#15100d', surface: '#211915', surfaceElevated: '#2c211b', border: '#4a352a', muted: '#2a211c' },
    { mode: 'dark' },
  ),
  urban_steel: preset(
    'urban_steel', 'Urban Steel', 'Aço, grafite e ciano para uma barbearia urbana e moderna.',
    ['barbershop'],
    { primary: '#64748b', accent: '#22d3ee', accentForeground: '#083344', ring: '#22d3ee', background: '#0f172a', surface: '#172033', surfaceElevated: '#202c42', border: '#334155', muted: '#1e293b' },
    { mode: 'dark' },
  ),
  rose_elegance: preset(
    'rose_elegance', 'Rose Elegance', 'Rosa profundo e blush suave com aparência elegante e editorial.',
    ['beauty_salon', 'nail_studio'],
    { primary: '#be185d', accent: '#f9a8d4', accentForeground: '#831843', ring: '#db2777', background: '#fff7fa', muted: '#fce7f3', border: '#fbcfe8' },
  ),
  champagne_blush: preset(
    'champagne_blush', 'Champagne Blush', 'Blush neutro com dourado champagne, sofisticado sem excesso de cor.',
    ['beauty_salon'],
    { primary: '#9f5f58', accent: '#d6b36a', accentForeground: '#3b2a16', ring: '#b7796f', background: '#fffaf7', muted: '#f7ece8', border: '#ead7cf' },
  ),
  sage_luxe: preset(
    'sage_luxe', 'Sage Luxe', 'Verde sálvia e detalhes quentes para marcas de beleza naturais e premium.',
    ['beauty_salon'],
    { primary: '#4f6f5d', accent: '#c3a46f', accentForeground: '#2f2414', ring: '#648672', background: '#f7faf6', muted: '#edf3ec', border: '#d5e1d3' },
  ),
  lavender_studio: preset(
    'lavender_studio', 'Lavender Studio', 'Lavanda vibrante com superfícies claras para um studio criativo.',
    ['nail_studio', 'beauty_salon'],
    { primary: '#7c3aed', accent: '#c4b5fd', accentForeground: '#4c1d95', ring: '#8b5cf6', background: '#faf7ff', muted: '#f3e8ff', border: '#e9d5ff' },
  ),
  blush_glass: preset(
    'blush_glass', 'Blush Glass', 'Blush translúcido, violeta e superfícies suaves para um visual contemporâneo.',
    ['nail_studio'],
    { primary: '#a855f7', primaryForeground: '#1f0a3d', accent: '#fb7185', accentForeground: '#5f0f2b', ring: '#c084fc', background: '#fff7fb', muted: '#fae8ff', border: '#f5d0fe', radius: '1.1rem' },
  ),
  cocoa_nude: preset(
    'cocoa_nude', 'Cocoa Nude', 'Nudes, cacau e areia para uma identidade minimalista, quente e refinada.',
    ['nail_studio'],
    { primary: '#7c4a3a', accent: '#d6a77a', accentForeground: '#3c241b', ring: '#9a6654', background: '#fbf7f4', muted: '#f3ebe6', border: '#e5d5cb' },
  ),
  forest_clean: preset(
    'forest_clean', 'Forest Clean', 'Verde natural e amarelo pontual com leitura limpa e confiável.',
    ['pet_shop'],
    { primary: '#166534', accent: '#facc15', accentForeground: '#422006', ring: '#15803d', background: '#f7faf7', muted: '#eaf4ec', border: '#cfe4d2' },
  ),
  ocean_playful: preset(
    'ocean_playful', 'Ocean Playful', 'Azul oceano e verde vivo para uma marca pet fresca, simpática e profissional.',
    ['pet_shop'],
    { primary: '#0369a1', accent: '#22c55e', accentForeground: '#052e16', ring: '#0284c7', background: '#f0f9ff', muted: '#e0f2fe', border: '#bae6fd', radius: '1rem' },
  ),
  sunshine_pet: preset(
    'sunshine_pet', 'Sunshine Pet', 'Terracota e amarelo ensolarado para uma presença acolhedora e energética.',
    ['pet_shop'],
    { primary: '#c2410c', accent: '#facc15', accentForeground: '#422006', ring: '#ea580c', background: '#fffaf0', muted: '#ffedd5', border: '#fed7aa', radius: '1rem' },
  ),
};

export const getThemePreset = (id: ThemeId | string): ThemePreset =>
  THEME_REGISTRY[id as ThemeId] ?? THEME_REGISTRY.minimal_light;

export function toCssVariables(theme: ThemePreset): Record<string, string> {
  return Object.fromEntries(Object.entries(theme.tokens).map(([key, value]) => [`--core-${key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`, value]));
}
