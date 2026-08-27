import type { ResolvedTheme } from './types';

/** Single neutral fallback used only while a fresh installation is unpublished. */
export const CORE_BOOTSTRAP_THEME: ResolvedTheme = {
  id: 'minimal:minimal_white', styleId: 'minimal', paletteId: 'minimal_white', mode: 'light',
  tokens: {
    background: '#f8fafc', canvas: '#eef2f6', foreground: '#111827', surface: '#ffffff', surfaceElevated: '#ffffff',
    primary: '#234b70', primaryForeground: '#ffffff', secondary: '#eef2f6', secondaryForeground: '#111827',
    accent: '#d9e7f2', accentForeground: '#183a59', muted: '#eef2f6', mutedForeground: '#526071', border: '#cbd5df',
    input: '#ffffff', ring: '#234b70', decorative: '#e4edf4', decorativeForeground: '#29465f', nav: '#172331', navForeground: '#f8fafc',
    heroGradient: 'linear-gradient(135deg, #ffffff 0%, #f0f4f8 62%, #e1ebf3 120%)',
    surfaceGradient: 'linear-gradient(145deg, #ffffff, #f8fafc)', cardBackground: '#ffffff', cardBorder: '#cbd5df',
    cta: '#234b70', ctaForeground: '#ffffff', success: '#15803d', warning: '#a34f08', danger: '#b42318', info: '#175cd3',
    fontBody: 'Inter, ui-sans-serif, system-ui, sans-serif', fontDisplay: 'Inter, ui-sans-serif, system-ui, sans-serif',
    headingTracking: '-.05em', radius: '.35rem', cardRadius: '.4rem', buttonRadius: '.25rem',
    shadow: '0 1px 0 rgb(15 23 42 / .08)', shadowStrong: '0 12px 36px rgb(15 23 42 / .12)', pattern: 'none',
  },
};
