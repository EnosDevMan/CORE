import { describe, expect, it } from 'vitest';
import { NICHE_REGISTRY } from '../niches/registry';
import type { ThemeId } from './types';
import { THEME_REGISTRY, toCssVariables } from './registry';

describe('theme registry', () => {
  it('exposes complete semantic tokens', () => {
    for (const theme of Object.values(THEME_REGISTRY)) {
      const variables = toCssVariables(theme);
      expect(variables['--core-primary']).toMatch(/^#/);
      expect(variables['--core-font-display']).toBeTruthy();
      expect(variables['--core-hero-gradient']).toMatch(/gradient/);
      expect(variables['--core-pattern']).toMatch(/gradient/);
      expect(Object.values(theme.tokens).every(value => value.trim().length > 0)).toBe(true);
      expect(Object.keys(variables)).toHaveLength(Object.keys(theme.tokens).length);
    }
  });

  it('offers a diverse curated catalog for every business niche', () => {
    expect(Object.keys(THEME_REGISTRY).length).toBeGreaterThanOrEqual(12);
    for (const niche of Object.values(NICHE_REGISTRY)) {
      const ids = niche.recommendedThemeIds as readonly ThemeId[];
      expect(ids.length).toBeGreaterThanOrEqual(5);
      expect(ids.every(id => Boolean(THEME_REGISTRY[id]))).toBe(true);
      const primaryColors = ids.map(id => THEME_REGISTRY[id].tokens.primary);
      expect(new Set(primaryColors).size).toBeGreaterThanOrEqual(4);
    }
  });
});
