import type { ThemeStyleId } from '../layouts/types';
import type { LegacyThemeId, PaletteId } from './types';

export const PALETTE_IDS = [
  'graphite', 'navy', 'copper', 'forest', 'burgundy', 'steel', 'cream', 'minimal_white', 'contemporary_blue',
  'rose', 'nude', 'champagne', 'lavender', 'sophisticated_black', 'terracotta', 'slate', 'blush', 'vibrant',
  'ocean', 'turquoise', 'soft_yellow', 'coral', 'aqua', 'playful',
] as const satisfies readonly PaletteId[];

export const LEGACY_THEME_APPEARANCE: Readonly<Record<LegacyThemeId, {
  styleId: ThemeStyleId;
  paletteId: PaletteId;
}>> = {
  minimal_light: { styleId: 'minimal', paletteId: 'minimal_white' },
  graphite_modern: { styleId: 'modern', paletteId: 'graphite' },
  premium_dark: { styleId: 'premium', paletteId: 'sophisticated_black' },
  heritage_copper: { styleId: 'heritage', paletteId: 'copper' },
  urban_steel: { styleId: 'modern', paletteId: 'steel' },
  rose_elegance: { styleId: 'editorial', paletteId: 'rose' },
  champagne_blush: { styleId: 'premium', paletteId: 'champagne' },
  lavender_studio: { styleId: 'showcase', paletteId: 'lavender' },
  blush_glass: { styleId: 'showcase', paletteId: 'blush' },
  forest_clean: { styleId: 'clean', paletteId: 'forest' },
  ocean_playful: { styleId: 'friendly', paletteId: 'ocean' },
  sunshine_pet: { styleId: 'friendly', paletteId: 'soft_yellow' },
};

export const LEGACY_THEME_ID_BY_PALETTE: Readonly<Record<PaletteId, LegacyThemeId>> = {
  graphite: 'premium_dark', navy: 'premium_dark', copper: 'heritage_copper', forest: 'forest_clean',
  burgundy: 'rose_elegance', steel: 'urban_steel', cream: 'minimal_light', minimal_white: 'minimal_light',
  contemporary_blue: 'graphite_modern', rose: 'rose_elegance', nude: 'champagne_blush', champagne: 'champagne_blush',
  lavender: 'lavender_studio', sophisticated_black: 'premium_dark', terracotta: 'champagne_blush', slate: 'graphite_modern',
  blush: 'blush_glass', vibrant: 'blush_glass', ocean: 'ocean_playful', turquoise: 'ocean_playful',
  soft_yellow: 'sunshine_pet', coral: 'sunshine_pet', aqua: 'ocean_playful', playful: 'ocean_playful',
};
