import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast';
import { resolvePaletteTokens } from './paletteMode';
import { PALETTE_REGISTRY } from './paletteRegistry';
import type { SurfaceMode } from './types';

const MODES: readonly SurfaceMode[] = ['light', 'dark'];

const expectReadable = (tokens: ReturnType<typeof resolvePaletteTokens>) => {
  expect(contrastRatio(tokens.foreground, tokens.background)).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio(tokens.foreground, tokens.canvas)).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio(tokens.foreground, tokens.surface)).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio(tokens.foreground, tokens.surfaceElevated)).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio(tokens.foreground, tokens.cardBackground)).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio(tokens.primaryForeground, tokens.primary)).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio(tokens.secondaryForeground, tokens.secondary)).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio(tokens.accentForeground, tokens.accent)).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio(tokens.mutedForeground, tokens.muted)).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio(tokens.navForeground, tokens.nav)).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio(tokens.decorativeForeground, tokens.decorative)).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio(tokens.ctaForeground, tokens.cta)).toBeGreaterThanOrEqual(4.5);
};

describe('palette contrast', () => {
  for (const palette of Object.values(PALETTE_REGISTRY)) {
    for (const mode of MODES) {
      it(`${palette.name} keeps generated ${mode} text pairs at WCAG AA`, () => {
        expectReadable(resolvePaletteTokens(palette.id, mode));
      });
    }
  }

  for (const mode of MODES) {
    it(`keeps a custom brand palette readable on ${mode} surfaces`, () => {
      expectReadable(resolvePaletteTokens('custom', mode, {
        primary: '#6c3150',
        secondary: '#d8a7b4',
        accent: '#c5a46d',
      }));
    });
  }
});
