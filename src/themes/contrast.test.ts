import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast';
import { PALETTE_REGISTRY } from './paletteRegistry';

describe('palette contrast', () => {
  it.each(Object.values(PALETTE_REGISTRY))('$name keeps every text pair at WCAG AA', palette => {
    const { tokens } = palette;
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
  });
});
