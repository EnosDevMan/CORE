import { getPalettePreset } from './paletteRegistry';
import { normalizeCustomPalette } from './paletteIdentity';
import type {
  CustomPaletteColors,
  PaletteId,
  PaletteSelectionId,
  PaletteTokens,
  SurfaceMode,
} from './types';

export { isHexColor, normalizeCustomPalette } from './paletteIdentity';

const rgb = (hex: string) => {
  const value = Number.parseInt(hex.slice(1), 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
};

const hex = ({ r, g, b }: { r: number; g: number; b: number }) =>
  `#${[r, g, b].map(channel => Math.round(Math.max(0, Math.min(255, channel))).toString(16).padStart(2, '0')).join('')}`;

/** weightB 0 keeps A, 1 keeps B. */
const mix = (a: string, b: string, weightB: number) => {
  const left = rgb(a);
  const right = rgb(b);
  return hex({
    r: left.r + (right.r - left.r) * weightB,
    g: left.g + (right.g - left.g) * weightB,
    b: left.b + (right.b - left.b) * weightB,
  });
};

const channelLuminance = (value: number) => {
  const normalized = value / 255;
  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
};

const luminance = (color: string) => {
  const value = rgb(color);
  return 0.2126 * channelLuminance(value.r)
    + 0.7152 * channelLuminance(value.g)
    + 0.0722 * channelLuminance(value.b);
};

const contrast = (a: string, b: string) => {
  const high = Math.max(luminance(a), luminance(b));
  const low = Math.min(luminance(a), luminance(b));
  return (high + 0.05) / (low + 0.05);
};

const readableForeground = (background: string) =>
  contrast(background, '#ffffff') >= contrast(background, '#111318') ? '#ffffff' : '#111318';

const ensureVisibleBrand = (color: string, background: string, mode: SurfaceMode, minimum = 3) => {
  if (contrast(color, background) >= minimum) return color;
  const destination = mode === 'dark' ? '#ffffff' : '#111318';
  for (let step = 1; step <= 8; step += 1) {
    const candidate = mix(color, destination, step * 0.08);
    if (contrast(candidate, background) >= minimum) return candidate;
  }
  return mix(color, destination, 0.72);
};

interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
}

export const getBrandColors = (
  paletteId: PaletteSelectionId,
  customColors?: CustomPaletteColors,
): BrandColors => {
  if (paletteId === 'custom') {
    return normalizeCustomPalette(customColors) ?? {
      primary: '#315f96',
      secondary: '#d9e7f2',
      accent: '#c9975b',
    };
  }
  const preset = getPalettePreset(paletteId as PaletteId);
  return {
    primary: preset.tokens.primary,
    secondary: preset.tokens.decorative,
    accent: preset.tokens.accent,
  };
};

export const getBrandSwatches = (
  paletteId: PaletteSelectionId,
  customColors?: CustomPaletteColors,
): readonly [string, string, string] => {
  const brand = getBrandColors(paletteId, customColors);
  return [brand.primary, brand.secondary, brand.accent];
};

/**
 * Brand identity and surface luminosity are intentionally independent.
 * A palette supplies three brand colours; this resolver builds the complete,
 * contrast-aware light/dark interface around them.
 */
export function resolvePaletteTokens(
  paletteId: PaletteSelectionId,
  mode: SurfaceMode,
  customColors?: CustomPaletteColors,
): PaletteTokens {
  const brand = getBrandColors(paletteId, customColors);
  const light = mode === 'light';

  const background = light ? mix(brand.secondary, '#ffffff', 0.94) : mix(brand.primary, '#090b10', 0.84);
  const canvas = light ? mix(brand.secondary, '#f3f5f7', 0.78) : mix(brand.secondary, '#10141b', 0.82);
  const surface = light ? mix(brand.secondary, '#ffffff', 0.975) : mix(brand.primary, '#171b22', 0.84);
  const surfaceElevated = light ? '#ffffff' : mix(brand.secondary, '#232932', 0.82);
  const foreground = light ? mix(brand.primary, '#141820', 0.84) : mix(brand.secondary, '#f7f8fa', 0.88);
  const muted = light ? mix(brand.secondary, '#f1f3f5', 0.78) : mix(brand.secondary, '#292f38', 0.77);
  const mutedForeground = light ? mix(brand.primary, '#647080', 0.7) : mix(brand.secondary, '#c4cad2', 0.77);
  const border = light ? mix(brand.secondary, '#cbd1d8', 0.73) : mix(brand.secondary, '#4a525e', 0.72);

  const primary = ensureVisibleBrand(brand.primary, background, mode);
  const secondary = ensureVisibleBrand(brand.secondary, background, mode, 1.8);
  const accent = ensureVisibleBrand(brand.accent, background, mode, 2.2);
  const decorative = light ? mix(brand.secondary, background, 0.36) : mix(brand.secondary, background, 0.58);
  const nav = light ? mix(brand.primary, '#151922', 0.72) : mix(brand.primary, '#06080c', 0.84);
  const cta = ensureVisibleBrand(brand.primary, background, mode, 4.1);

  return {
    background,
    canvas,
    foreground,
    surface,
    surfaceElevated,
    primary,
    primaryForeground: readableForeground(primary),
    secondary,
    secondaryForeground: readableForeground(secondary),
    accent,
    accentForeground: readableForeground(accent),
    muted,
    mutedForeground,
    border,
    input: surfaceElevated,
    ring: primary,
    decorative,
    decorativeForeground: readableForeground(decorative),
    nav,
    navForeground: readableForeground(nav),
    heroGradient: `linear-gradient(135deg, ${background} 0%, ${canvas} 58%, ${mix(accent, background, light ? 0.66 : 0.76)} 120%)`,
    surfaceGradient: `linear-gradient(145deg, ${surfaceElevated}, ${background})`,
    cardBackground: surface,
    cardBorder: border,
    cta,
    ctaForeground: readableForeground(cta),
  };
}
