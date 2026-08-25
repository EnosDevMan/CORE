import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast';
import { THEME_REGISTRY } from './registry';

describe('theme contrast', () => {
  it.each(Object.values(THEME_REGISTRY))('$name keeps text pairs at WCAG AA', theme => {
    expect(contrastRatio(theme.tokens.foreground, theme.tokens.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(theme.tokens.primaryForeground, theme.tokens.primary)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(theme.tokens.secondaryForeground, theme.tokens.secondary)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(theme.tokens.accentForeground, theme.tokens.accent)).toBeGreaterThanOrEqual(4.5);
  });
});
