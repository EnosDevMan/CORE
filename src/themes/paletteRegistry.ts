import type { LegacyThemeId, PaletteId, PalettePreset, PaletteTokens, ThemeMode } from './types';

interface PaletteSeed {
  id: PaletteId;
  name: string;
  description: string;
  legacyThemeId: LegacyThemeId;
  mode?: ThemeMode;
  background: string;
  canvas: string;
  foreground: string;
  surface: string;
  surfaceElevated?: string;
  primary: string;
  primaryForeground: string;
  accent: string;
  accentForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  decorative: string;
  decorativeForeground: string;
  nav: string;
  navForeground: string;
  heroGradient: string;
  cta?: string;
  ctaForeground?: string;
}

const createPalette = (seed: PaletteSeed): PalettePreset => {
  const tokens: PaletteTokens = {
    background: seed.background,
    canvas: seed.canvas,
    foreground: seed.foreground,
    surface: seed.surface,
    surfaceElevated: seed.surfaceElevated ?? seed.surface,
    primary: seed.primary,
    primaryForeground: seed.primaryForeground,
    secondary: seed.muted,
    secondaryForeground: seed.foreground,
    accent: seed.accent,
    accentForeground: seed.accentForeground,
    muted: seed.muted,
    mutedForeground: seed.mutedForeground,
    border: seed.border,
    input: seed.surface,
    ring: seed.primary,
    decorative: seed.decorative,
    decorativeForeground: seed.decorativeForeground,
    nav: seed.nav,
    navForeground: seed.navForeground,
    heroGradient: seed.heroGradient,
    surfaceGradient: `linear-gradient(145deg, ${seed.surface}, ${seed.background})`,
    cardBackground: seed.surface,
    cardBorder: seed.border,
    cta: seed.cta ?? seed.primary,
    ctaForeground: seed.ctaForeground ?? seed.primaryForeground,
  };

  return {
    id: seed.id,
    name: seed.name,
    description: seed.description,
    legacyThemeId: seed.legacyThemeId,
    mode: seed.mode ?? 'light',
    swatches: [tokens.background, tokens.primary, tokens.accent, tokens.nav],
    tokens,
  };
};

/** Brand palettes are global; niche affinity and ordering live in NICHE_REGISTRY. */
export const PALETTE_REGISTRY: Readonly<Record<PaletteId, PalettePreset>> = {
  graphite: createPalette({
    id: 'graphite', name: 'Graphite', description: 'Grafite profundo com detalhe mineral e contraste preciso.', legacyThemeId: 'premium_dark', mode: 'dark',
    background: '#101214', canvas: '#15191d', foreground: '#f5f7f8', surface: '#1b2025', surfaceElevated: '#252b31',
    primary: '#c5ccd3', primaryForeground: '#111417', accent: '#69c3bd', accentForeground: '#092d2b',
    muted: '#272d33', mutedForeground: '#b7c0c8', border: '#414950', decorative: '#293c3d', decorativeForeground: '#d9f4f1',
    nav: '#090b0d', navForeground: '#f7f8f9', heroGradient: 'linear-gradient(135deg, #0b0d0f 0%, #1b2025 62%, #244243 115%)',
  }),
  navy: createPalette({
    id: 'navy', name: 'Navy', description: 'Azul-marinho elegante com acento quente e confiável.', legacyThemeId: 'premium_dark', mode: 'dark',
    background: '#0b1424', canvas: '#101c30', foreground: '#f4f7fb', surface: '#15243a', surfaceElevated: '#1d304b',
    primary: '#9bbfe9', primaryForeground: '#0c223a', accent: '#e0bd73', accentForeground: '#322307',
    muted: '#21334b', mutedForeground: '#bdcce0', border: '#3b506b', decorative: '#203d5d', decorativeForeground: '#e4f0ff',
    nav: '#07101d', navForeground: '#f6f9fd', heroGradient: 'linear-gradient(135deg, #07101d 0%, #142844 62%, #4a3d25 125%)',
  }),
  copper: createPalette({
    id: 'copper', name: 'Copper', description: 'Cobre artesanal equilibrado por creme e marrom profundo.', legacyThemeId: 'heritage_copper',
    background: '#fbf7f2', canvas: '#efe5da', foreground: '#2f2119', surface: '#fffdf9', primary: '#8b4a25', primaryForeground: '#ffffff',
    accent: '#e5b47f', accentForeground: '#3d210f', muted: '#f0e4d8', mutedForeground: '#654f40', border: '#d9c2ad',
    decorative: '#ead2bb', decorativeForeground: '#54301c', nav: '#34231b', navForeground: '#fffaf4',
    heroGradient: 'linear-gradient(135deg, #fffaf4 0%, #f0e1d2 58%, #dfaa78 118%)',
  }),
  forest: createPalette({
    id: 'forest', name: 'Forest', description: 'Verde natural, sereno e profissional com calor discreto.', legacyThemeId: 'forest_clean',
    background: '#f6faf7', canvas: '#e6f0e9', foreground: '#162d22', surface: '#ffffff', primary: '#286044', primaryForeground: '#ffffff',
    accent: '#e2b95f', accentForeground: '#342605', muted: '#e6f1e9', mutedForeground: '#496557', border: '#c5dacb',
    decorative: '#d3e8d9', decorativeForeground: '#234d37', nav: '#173b2b', navForeground: '#f5fff8',
    heroGradient: 'linear-gradient(135deg, #f4fbf6 0%, #dcecdf 58%, #f7e6b6 120%)',
  }),
  burgundy: createPalette({
    id: 'burgundy', name: 'Burgundy', description: 'Vinho sofisticado com rosa antigo e superfícies claras.', legacyThemeId: 'rose_elegance',
    background: '#fcf7f8', canvas: '#f1e5e8', foreground: '#321923', surface: '#ffffff', primary: '#7e2947', primaryForeground: '#ffffff',
    accent: '#ddb4bc', accentForeground: '#4e1c2d', muted: '#f2e6e9', mutedForeground: '#72515d', border: '#dec6cd',
    decorative: '#ead2d8', decorativeForeground: '#64243b', nav: '#461827', navForeground: '#fff8fa',
    heroGradient: 'linear-gradient(135deg, #fffafb 0%, #f0dfe4 58%, #dfb7c1 120%)',
  }),
  steel: createPalette({
    id: 'steel', name: 'Steel', description: 'Aço azulado urbano com acento turquesa controlado.', legacyThemeId: 'urban_steel', mode: 'dark',
    background: '#0e1722', canvas: '#131f2d', foreground: '#f3f7fa', surface: '#192838', surfaceElevated: '#223447',
    primary: '#abc0d3', primaryForeground: '#112334', accent: '#5dd4ca', accentForeground: '#073a36',
    muted: '#253649', mutedForeground: '#bdcad6', border: '#40556a', decorative: '#20414b', decorativeForeground: '#ddf8f5',
    nav: '#09111b', navForeground: '#f5f9fc', heroGradient: 'linear-gradient(125deg, #09111b 0%, #1a3045 60%, #145052 125%)',
  }),
  cream: createPalette({
    id: 'cream', name: 'Cream', description: 'Creme clássico, tinta escura e detalhe dourado discreto.', legacyThemeId: 'minimal_light',
    background: '#fbf8ef', canvas: '#eee8d8', foreground: '#2d2a22', surface: '#fffdf7', primary: '#4d493b', primaryForeground: '#ffffff',
    accent: '#d3a94f', accentForeground: '#322506', muted: '#eee9dc', mutedForeground: '#625e51', border: '#d8d0bd',
    decorative: '#e9ddc1', decorativeForeground: '#55472a', nav: '#302e27', navForeground: '#fffdf6',
    heroGradient: 'linear-gradient(135deg, #fffdf7 0%, #eee7d5 62%, #ead39f 120%)',
  }),
  minimal_white: createPalette({
    id: 'minimal_white', name: 'Minimal White', description: 'Branco neutro, preto suave e azul de ação universal.', legacyThemeId: 'minimal_light',
    background: '#f8fafc', canvas: '#eef2f6', foreground: '#111827', surface: '#ffffff', primary: '#234b70', primaryForeground: '#ffffff',
    accent: '#d9e7f2', accentForeground: '#183a59', muted: '#eef2f6', mutedForeground: '#526071', border: '#cbd5df',
    decorative: '#e4edf4', decorativeForeground: '#29465f', nav: '#172331', navForeground: '#f8fafc',
    heroGradient: 'linear-gradient(135deg, #ffffff 0%, #f0f4f8 62%, #e1ebf3 120%)',
  }),
  contemporary_blue: createPalette({
    id: 'contemporary_blue', name: 'Contemporary Blue', description: 'Azul contemporâneo, claro e comercial.', legacyThemeId: 'graphite_modern',
    background: '#f6f9fd', canvas: '#e8eff8', foreground: '#15243a', surface: '#ffffff', primary: '#245b9b', primaryForeground: '#ffffff',
    accent: '#9fd4cd', accentForeground: '#123f3a', muted: '#e8eff7', mutedForeground: '#52657d', border: '#c8d7e8',
    decorative: '#d9e8f5', decorativeForeground: '#254e76', nav: '#183a63', navForeground: '#f7fbff',
    heroGradient: 'linear-gradient(135deg, #f9fbff 0%, #e3edf8 58%, #d2ece8 120%)',
  }),
  rose: createPalette({
    id: 'rose', name: 'Rose', description: 'Rosa profundo, elegante e editorial com base muito clara.', legacyThemeId: 'rose_elegance',
    background: '#fff8fa', canvas: '#f7ebef', foreground: '#351923', surface: '#ffffff', primary: '#96375a', primaryForeground: '#ffffff',
    accent: '#efc3d0', accentForeground: '#5a2035', muted: '#f7e8ed', mutedForeground: '#745462', border: '#e8cbd4',
    decorative: '#f1d7df', decorativeForeground: '#6b2941', nav: '#572036', navForeground: '#fff8fb',
    heroGradient: 'linear-gradient(140deg, #fff9fb 0%, #f7e3e9 58%, #edc8d4 120%)',
  }),
  nude: createPalette({
    id: 'nude', name: 'Nude', description: 'Neutros quentes, pele mineral e contraste marrom refinado.', legacyThemeId: 'champagne_blush',
    background: '#fcf9f7', canvas: '#f0e8e2', foreground: '#342621', surface: '#ffffff', primary: '#765044', primaryForeground: '#ffffff',
    accent: '#dfbda9', accentForeground: '#4b2f25', muted: '#f1e8e3', mutedForeground: '#6d594f', border: '#ddccc2',
    decorative: '#ead9cf', decorativeForeground: '#5d4035', nav: '#4b342d', navForeground: '#fffaf7',
    heroGradient: 'linear-gradient(135deg, #fffaf8 0%, #efe3dc 60%, #e0bdab 120%)',
  }),
  champagne: createPalette({
    id: 'champagne', name: 'Champagne', description: 'Champagne sereno, porcelana e marrom de luxo discreto.', legacyThemeId: 'champagne_blush',
    background: '#fffbf5', canvas: '#f3ecdf', foreground: '#332b20', surface: '#ffffff', primary: '#66503a', primaryForeground: '#ffffff',
    accent: '#d7b45f', accentForeground: '#382b08', muted: '#f2ecdf', mutedForeground: '#6b6253', border: '#ded2bd',
    decorative: '#eadfc8', decorativeForeground: '#57472f', nav: '#45372a', navForeground: '#fffaf1',
    heroGradient: 'linear-gradient(135deg, #fffdf8 0%, #f2eadb 60%, #e8d09a 120%)',
  }),
  lavender: createPalette({
    id: 'lavender', name: 'Lavender', description: 'Lavanda criativa com violeta profundo e blush suave.', legacyThemeId: 'lavender_studio',
    background: '#fbf9ff', canvas: '#eee9f8', foreground: '#281d3b', surface: '#ffffff', primary: '#6544a6', primaryForeground: '#ffffff',
    accent: '#d9c9f3', accentForeground: '#452878', muted: '#f0eafa', mutedForeground: '#655578', border: '#d9cff0',
    decorative: '#e5daf8', decorativeForeground: '#52358a', nav: '#3e2b63', navForeground: '#fcfaff',
    heroGradient: 'linear-gradient(135deg, #fcfaff 0%, #e9e0f8 56%, #f7dce7 120%)',
  }),
  sophisticated_black: createPalette({
    id: 'sophisticated_black', name: 'Sophisticated Black', description: 'Preto sofisticado com champagne e rosa mineral.', legacyThemeId: 'premium_dark', mode: 'dark',
    background: '#0b0b0d', canvas: '#111216', foreground: '#f8f6f3', surface: '#18191e', surfaceElevated: '#222329',
    primary: '#dfc28e', primaryForeground: '#2a200d', accent: '#d8aebc', accentForeground: '#3c1d27', muted: '#27282e', mutedForeground: '#c6c3c0',
    border: '#414148', decorative: '#342b2d', decorativeForeground: '#f3dde4', nav: '#070708', navForeground: '#faf8f5',
    heroGradient: 'linear-gradient(130deg, #080809 0%, #1a1a1f 62%, #3a2d26 125%)',
  }),
  terracotta: createPalette({
    id: 'terracotta', name: 'Terracotta', description: 'Terracota contemporânea com areia e verde acinzentado.', legacyThemeId: 'champagne_blush',
    background: '#fcf8f4', canvas: '#f1e6dd', foreground: '#38251e', surface: '#ffffff', primary: '#9a4d35', primaryForeground: '#ffffff',
    accent: '#b8c9b5', accentForeground: '#263d29', muted: '#f2e7df', mutedForeground: '#74584b', border: '#dfc9bb',
    decorative: '#ebd4c5', decorativeForeground: '#6c3827', nav: '#5d3025', navForeground: '#fff9f5',
    heroGradient: 'linear-gradient(135deg, #fffaf6 0%, #f0dfd3 58%, #dce5d8 120%)',
  }),
  slate: createPalette({
    id: 'slate', name: 'Slate', description: 'Cinza frio, azul ardósia e detalhe lilás contemporâneo.', legacyThemeId: 'graphite_modern',
    background: '#f7f8fa', canvas: '#e9edf2', foreground: '#1d2633', surface: '#ffffff', primary: '#465b73', primaryForeground: '#ffffff',
    accent: '#c9c0df', accentForeground: '#403455', muted: '#e9edf2', mutedForeground: '#586677', border: '#ccd4dd',
    decorative: '#dde3ea', decorativeForeground: '#405269', nav: '#293746', navForeground: '#f8fafc',
    heroGradient: 'linear-gradient(135deg, #fbfcfd 0%, #e7ebf0 60%, #ded8eb 120%)',
  }),
  blush: createPalette({
    id: 'blush', name: 'Blush', description: 'Blush leve com ameixa e acabamento glossy controlado.', legacyThemeId: 'blush_glass',
    background: '#fff8fc', canvas: '#f7eaf1', foreground: '#351d2d', surface: '#ffffff', primary: '#82476d', primaryForeground: '#ffffff',
    accent: '#efbdce', accentForeground: '#57223a', muted: '#f7e8ef', mutedForeground: '#735567', border: '#e8ccd9',
    decorative: '#f2d7e2', decorativeForeground: '#67344f', nav: '#4e2941', navForeground: '#fff9fc',
    heroGradient: 'linear-gradient(125deg, #fff9fc 0%, #f3dfe9 52%, #e3ddf5 110%)',
  }),
  vibrant: createPalette({
    id: 'vibrant', name: 'Vibrant', description: 'Magenta sofisticado e violeta suave, vibrante sem neon.', legacyThemeId: 'blush_glass',
    background: '#fff8fd', canvas: '#f4e8f4', foreground: '#321b32', surface: '#ffffff', primary: '#8d3479', primaryForeground: '#ffffff',
    accent: '#d8b9ed', accentForeground: '#49245e', muted: '#f4e8f4', mutedForeground: '#705570', border: '#e2cbe2',
    decorative: '#eed5eb', decorativeForeground: '#6c2b61', nav: '#502046', navForeground: '#fff8fd',
    heroGradient: 'linear-gradient(130deg, #fff8fd 0%, #f2ddef 55%, #ded1f1 115%)',
  }),
  ocean: createPalette({
    id: 'ocean', name: 'Ocean', description: 'Azul oceano fresco com verde água e leitura segura.', legacyThemeId: 'ocean_playful',
    background: '#f3fafd', canvas: '#e1eff5', foreground: '#15303d', surface: '#ffffff', primary: '#176681', primaryForeground: '#ffffff',
    accent: '#9edbc4', accentForeground: '#164a38', muted: '#e3f1f6', mutedForeground: '#4f6b77', border: '#bddbe5',
    decorative: '#d0eaf1', decorativeForeground: '#205a70', nav: '#104d63', navForeground: '#f4fcff',
    heroGradient: 'linear-gradient(140deg, #f3fbff 0%, #d5edf3 55%, #d8f1df 112%)',
  }),
  turquoise: createPalette({
    id: 'turquoise', name: 'Turquoise', description: 'Turquesa limpo com marinho e energia leve.', legacyThemeId: 'ocean_playful',
    background: '#f2fbfa', canvas: '#dff2ef', foreground: '#143432', surface: '#ffffff', primary: '#19736d', primaryForeground: '#ffffff',
    accent: '#f0c76a', accentForeground: '#3b2c08', muted: '#e2f2f0', mutedForeground: '#4c6d69', border: '#bcded9',
    decorative: '#cdebe7', decorativeForeground: '#185b56', nav: '#11534f', navForeground: '#f3fffd',
    heroGradient: 'linear-gradient(135deg, #f3fffd 0%, #d3eeea 58%, #f8e7b7 120%)',
  }),
  soft_yellow: createPalette({
    id: 'soft_yellow', name: 'Soft Yellow', description: 'Amarelo solar suave, argila e base cremosa acolhedora.', legacyThemeId: 'sunshine_pet',
    background: '#fffbf1', canvas: '#f4ecd8', foreground: '#382d1a', surface: '#ffffff', primary: '#8b4a2d', primaryForeground: '#ffffff',
    accent: '#e7bd3f', accentForeground: '#342805', muted: '#f5ecd8', mutedForeground: '#6d6048', border: '#e1d3b2',
    decorative: '#f5e2a9', decorativeForeground: '#594716', nav: '#593521', navForeground: '#fffaf0',
    heroGradient: 'linear-gradient(135deg, #fffcf2 0%, #f6e9c7 56%, #f2d66f 116%)',
  }),
  coral: createPalette({
    id: 'coral', name: 'Coral', description: 'Coral caloroso com azul petróleo para equilíbrio.', legacyThemeId: 'sunshine_pet',
    background: '#fff8f5', canvas: '#f5e8e2', foreground: '#38231f', surface: '#ffffff', primary: '#a84735', primaryForeground: '#ffffff',
    accent: '#9acbc7', accentForeground: '#194744', muted: '#f5e8e3', mutedForeground: '#73574f', border: '#e5c9bf',
    decorative: '#f0d5cb', decorativeForeground: '#76382c', nav: '#633026', navForeground: '#fff9f6',
    heroGradient: 'linear-gradient(135deg, #fff9f6 0%, #f4ddd5 56%, #d7ece9 116%)',
  }),
  aqua: createPalette({
    id: 'aqua', name: 'Aqua', description: 'Água clara, azul profundo e um toque cítrico suave.', legacyThemeId: 'ocean_playful',
    background: '#f2fbfc', canvas: '#dff1f3', foreground: '#153238', surface: '#ffffff', primary: '#1c6874', primaryForeground: '#ffffff',
    accent: '#c9dc72', accentForeground: '#34410d', muted: '#e1f1f3', mutedForeground: '#4d6c72', border: '#bddde1',
    decorative: '#ccebef', decorativeForeground: '#205a64', nav: '#134d57', navForeground: '#f3fdff',
    heroGradient: 'linear-gradient(135deg, #f2fdff 0%, #d4edf0 58%, #edf2bd 120%)',
  }),
  playful: createPalette({
    id: 'playful', name: 'Playful', description: 'Azul amigável, coral e amarelo suave em proporção profissional.', legacyThemeId: 'ocean_playful',
    background: '#f7faff', canvas: '#e7eef8', foreground: '#1b2b42', surface: '#ffffff', primary: '#315f96', primaryForeground: '#ffffff',
    accent: '#e8a173', accentForeground: '#4a2510', muted: '#e9eff8', mutedForeground: '#54667d', border: '#cad7e8',
    decorative: '#f3dfb9', decorativeForeground: '#594414', nav: '#24466e', navForeground: '#f7fbff',
    heroGradient: 'linear-gradient(135deg, #f8fbff 0%, #dde8f5 52%, #f5d8c5 110%)',
  }),
};

export const getPalettePreset = (id: PaletteId | string): PalettePreset =>
  PALETTE_REGISTRY[id as PaletteId] ?? PALETTE_REGISTRY.minimal_white;
