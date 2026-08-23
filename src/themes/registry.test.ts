import { describe, expect, it } from 'vitest';
import { THEME_REGISTRY, toCssVariables } from './registry';

describe('theme registry', () => {
  it('exposes complete semantic tokens', () => {
    for (const theme of Object.values(THEME_REGISTRY)) {
      expect(toCssVariables(theme)['--core-primary']).toMatch(/^#/);
      expect(theme.tokens.primaryForeground).toBeTruthy();
      expect(theme.tokens.ring).toBeTruthy();
    }
  });
});
