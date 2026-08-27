import type { CustomPaletteColors, PaletteSelectionId, SurfaceMode } from './types';

const HEX = /^#[0-9a-f]{6}$/i;
const LEGACY_DARK_PALETTES = new Set<PaletteSelectionId>([
  'graphite', 'navy', 'steel', 'sophisticated_black',
]);

export const isHexColor = (value: unknown): value is string =>
  typeof value === 'string' && HEX.test(value);

export const normalizeCustomPalette = (
  value: Partial<CustomPaletteColors> | undefined,
): CustomPaletteColors | undefined => {
  if (!value || !isHexColor(value.primary) || !isHexColor(value.secondary) || !isHexColor(value.accent)) {
    return undefined;
  }
  return {
    primary: value.primary.toLowerCase(),
    secondary: value.secondary.toLowerCase(),
    accent: value.accent.toLowerCase(),
  };
};

/**
 * Compatibility default only. Once surface_mode is persisted, the owner can
 * use every curated or custom brand identity on either light or dark surfaces.
 */
export const getDefaultSurfaceMode = (paletteId: PaletteSelectionId): SurfaceMode =>
  LEGACY_DARK_PALETTES.has(paletteId) ? 'dark' : 'light';
