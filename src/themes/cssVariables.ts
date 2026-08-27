import type { ResolvedTheme } from './types';

export function toCssVariables(theme: Pick<ResolvedTheme, 'tokens'>): Record<string, string> {
  return Object.fromEntries(Object.entries(theme.tokens).map(([key, value]) => [
    `--core-${key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`,
    value,
  ]));
}
