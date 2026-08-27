import { describe, expect, it } from 'vitest';
import { THEME_STYLE_REGISTRY } from '../layouts/registry';
import { NICHE_REGISTRY } from '../niches/registry';
import { PALETTE_REGISTRY, resolveTheme, SEMANTIC_TOKENS, THEME_REGISTRY, toCssVariables } from './registry';

describe('theme registry', () => {
  it('exposes complete semantic tokens', () => {
    for (const theme of Object.values(THEME_REGISTRY)) {
      const variables = toCssVariables(theme);
      expect(variables['--core-primary']).toMatch(/^#/);
      expect(variables['--core-font-display']).toBeTruthy();
      expect(variables['--core-hero-gradient']).toMatch(/gradient/);
      expect(variables['--core-pattern']).toBeTruthy();
      expect(Object.values(theme.tokens).every(value => value.trim().length > 0)).toBe(true);
      expect(Object.keys(variables)).toHaveLength(Object.keys(theme.tokens).length);
    }
  });

  it('offers a diverse curated catalog for every business niche', () => {
    expect(Object.keys(THEME_STYLE_REGISTRY)).toHaveLength(8);
    expect(Object.keys(PALETTE_REGISTRY)).toHaveLength(24);
    for (const niche of Object.values(NICHE_REGISTRY)) {
      expect(niche.availableStyleIds).toHaveLength(4);
      expect(niche.availablePaletteIds.length).toBeGreaterThanOrEqual(9);
      const primaryColors = niche.availablePaletteIds.map(id => PALETTE_REGISTRY[id].tokens.primary);
      expect(new Set(primaryColors).size).toBe(niche.availablePaletteIds.length);
    }
  });

  it('keeps semantic status colours independent from every brand palette', () => {
    for (const styleId of Object.keys(THEME_STYLE_REGISTRY) as Array<keyof typeof THEME_STYLE_REGISTRY>) {
      for (const paletteId of Object.keys(PALETTE_REGISTRY) as Array<keyof typeof PALETTE_REGISTRY>) {
        const theme = resolveTheme(styleId, paletteId);
        expect(theme.tokens.success).toBe(SEMANTIC_TOKENS.success);
        expect(theme.tokens.danger).toBe(SEMANTIC_TOKENS.danger);
      }
    }
  });
});
