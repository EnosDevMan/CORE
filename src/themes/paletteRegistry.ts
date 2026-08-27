import type { CustomPaletteColors, LegacyThemeId, PaletteId, PalettePreset, SurfaceMode } from './types';

interface PaletteSeed {
  id: PaletteId;
  name: string;
  description: string;
  legacyThemeId: LegacyThemeId;
  colors: CustomPaletteColors;
  mode?: SurfaceMode;
}

const palette = (seed: PaletteSeed): PalettePreset => ({
  ...seed,
  mode: seed.mode ?? 'light',
  swatches: [seed.colors.primary, seed.colors.secondary, seed.colors.accent],
});

/**
 * Curated palettes store brand identity only. Backgrounds, text, borders,
 * navigation and CTA are derived from these colours + the selected surface
 * mode in paletteMode.ts. This keeps colour and luminosity independent.
 */
export const PALETTE_REGISTRY: Readonly<Record<PaletteId, PalettePreset>> = {
  graphite: palette({
    id: 'graphite', name: 'Graphite', description: 'Grafite mineral, turquesa controlado e presença técnica.', legacyThemeId: 'premium_dark', mode: 'dark',
    colors: { primary: '#c5ccd3', secondary: '#293c3d', accent: '#69c3bd' },
  }),
  navy: palette({
    id: 'navy', name: 'Navy', description: 'Azul-marinho elegante com acento quente e confiável.', legacyThemeId: 'premium_dark', mode: 'dark',
    colors: { primary: '#9bbfe9', secondary: '#203d5d', accent: '#e0bd73' },
  }),
  copper: palette({
    id: 'copper', name: 'Copper', description: 'Cobre artesanal, creme mineral e calor sofisticado.', legacyThemeId: 'heritage_copper',
    colors: { primary: '#8b4a25', secondary: '#ead2bb', accent: '#e5b47f' },
  }),
  forest: palette({
    id: 'forest', name: 'Forest', description: 'Verde natural, sereno e profissional com calor discreto.', legacyThemeId: 'forest_clean',
    colors: { primary: '#286044', secondary: '#d3e8d9', accent: '#e2b95f' },
  }),
  burgundy: palette({
    id: 'burgundy', name: 'Burgundy', description: 'Vinho sofisticado com rosa antigo e presença elegante.', legacyThemeId: 'rose_elegance',
    colors: { primary: '#7e2947', secondary: '#ead2d8', accent: '#ddb4bc' },
  }),
  steel: palette({
    id: 'steel', name: 'Steel', description: 'Aço azulado urbano com turquesa preciso.', legacyThemeId: 'urban_steel', mode: 'dark',
    colors: { primary: '#abc0d3', secondary: '#20414b', accent: '#5dd4ca' },
  }),
  cream: palette({
    id: 'cream', name: 'Cream', description: 'Neutro clássico com tinta escura e dourado discreto.', legacyThemeId: 'minimal_light',
    colors: { primary: '#4d493b', secondary: '#e9ddc1', accent: '#d3a94f' },
  }),
  minimal_white: palette({
    id: 'minimal_white', name: 'Minimal White', description: 'Azul sóbrio com neutros muito claros e universais.', legacyThemeId: 'minimal_light',
    colors: { primary: '#234b70', secondary: '#e4edf4', accent: '#d9e7f2' },
  }),
  contemporary_blue: palette({
    id: 'contemporary_blue', name: 'Contemporary Blue', description: 'Azul contemporâneo com verde água comercial.', legacyThemeId: 'graphite_modern',
    colors: { primary: '#245b9b', secondary: '#d9e8f5', accent: '#9fd4cd' },
  }),
  rose: palette({
    id: 'rose', name: 'Rose', description: 'Rosa profundo e editorial com apoio suave.', legacyThemeId: 'rose_elegance',
    colors: { primary: '#96375a', secondary: '#f1d7df', accent: '#efc3d0' },
  }),
  nude: palette({
    id: 'nude', name: 'Nude', description: 'Neutros quentes, pele mineral e marrom refinado.', legacyThemeId: 'champagne_blush',
    colors: { primary: '#765044', secondary: '#ead9cf', accent: '#dfbda9' },
  }),
  champagne: palette({
    id: 'champagne', name: 'Champagne', description: 'Champagne sereno e dourado de luxo discreto.', legacyThemeId: 'champagne_blush',
    colors: { primary: '#66503a', secondary: '#eadfc8', accent: '#d7b45f' },
  }),
  lavender: palette({
    id: 'lavender', name: 'Lavender', description: 'Lavanda criativa com violeta profundo e acabamento suave.', legacyThemeId: 'lavender_studio',
    colors: { primary: '#6544a6', secondary: '#e5daf8', accent: '#d9c9f3' },
  }),
  sophisticated_black: palette({
    id: 'sophisticated_black', name: 'Sophisticated Black', description: 'Champagne, preto de referência e rosa mineral.', legacyThemeId: 'premium_dark', mode: 'dark',
    colors: { primary: '#dfc28e', secondary: '#342b2d', accent: '#d8aebc' },
  }),
  terracotta: palette({
    id: 'terracotta', name: 'Terracotta', description: 'Terracota contemporânea com areia e verde acinzentado.', legacyThemeId: 'champagne_blush',
    colors: { primary: '#9a4d35', secondary: '#ebd4c5', accent: '#b8c9b5' },
  }),
  slate: palette({
    id: 'slate', name: 'Slate', description: 'Cinza frio, azul ardósia e lilás contemporâneo.', legacyThemeId: 'graphite_modern',
    colors: { primary: '#465b73', secondary: '#dde3ea', accent: '#c9c0df' },
  }),
  blush: palette({
    id: 'blush', name: 'Blush', description: 'Blush leve com ameixa e acabamento polido.', legacyThemeId: 'blush_glass',
    colors: { primary: '#82476d', secondary: '#f2d7e2', accent: '#efbdce' },
  }),
  vibrant: palette({
    id: 'vibrant', name: 'Vibrant', description: 'Magenta sofisticado e violeta suave, vibrante sem neon.', legacyThemeId: 'blush_glass',
    colors: { primary: '#8d3479', secondary: '#eed5eb', accent: '#d8b9ed' },
  }),
  ocean: palette({
    id: 'ocean', name: 'Ocean', description: 'Azul oceano fresco com verde água e leitura segura.', legacyThemeId: 'ocean_playful',
    colors: { primary: '#176681', secondary: '#d0eaf1', accent: '#9edbc4' },
  }),
  turquoise: palette({
    id: 'turquoise', name: 'Turquoise', description: 'Turquesa limpo com amarelo quente e energia leve.', legacyThemeId: 'ocean_playful',
    colors: { primary: '#19736d', secondary: '#cdebe7', accent: '#f0c76a' },
  }),
  soft_yellow: palette({
    id: 'soft_yellow', name: 'Soft Yellow', description: 'Amarelo solar suave, argila e base acolhedora.', legacyThemeId: 'sunshine_pet',
    colors: { primary: '#8b4a2d', secondary: '#f5e2a9', accent: '#e7bd3f' },
  }),
  coral: palette({
    id: 'coral', name: 'Coral', description: 'Coral caloroso com azul petróleo para equilíbrio.', legacyThemeId: 'sunshine_pet',
    colors: { primary: '#a84735', secondary: '#f0d5cb', accent: '#9acbc7' },
  }),
  aqua: palette({
    id: 'aqua', name: 'Aqua', description: 'Água clara, azul profundo e toque cítrico suave.', legacyThemeId: 'ocean_playful',
    colors: { primary: '#1c6874', secondary: '#ccebef', accent: '#c9dc72' },
  }),
  playful: palette({
    id: 'playful', name: 'Playful', description: 'Azul amigável, coral e amarelo em proporção profissional.', legacyThemeId: 'ocean_playful',
    colors: { primary: '#315f96', secondary: '#f3dfb9', accent: '#e8a173' },
  }),
};

export const getPalettePreset = (id: PaletteId | string): PalettePreset =>
  PALETTE_REGISTRY[id as PaletteId] ?? PALETTE_REGISTRY.minimal_white;
