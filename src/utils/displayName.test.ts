import { describe, expect, it } from 'vitest';
import { getCompactDisplayName } from './displayName';

describe('getCompactDisplayName', () => {
  it('shows the first name plus the initial of the second name', () => {
    expect(getCompactDisplayName('Enos Duarte Man')).toBe('Enos D.');
  });

  it('keeps a single name unchanged', () => {
    expect(getCompactDisplayName('Enos')).toBe('Enos');
  });

  it('normalizes surrounding and repeated whitespace', () => {
    expect(getCompactDisplayName('  Enos   Duarte Silva  ')).toBe('Enos D.');
  });

  it('handles a lowercase second name by capitalizing the initial', () => {
    expect(getCompactDisplayName('Enos duarte')).toBe('Enos D.');
  });
});
