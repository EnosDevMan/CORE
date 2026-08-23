import { describe, expect, it } from 'vitest';
import { normalizeExternalUrl, safeExternalUrl } from './externalUrl';

describe('external URLs', () => {
  it('normalizes HTTPS social links and accepts provider subdomains', () => {
    expect(normalizeExternalUrl('instagram.com/studio', ['instagram.com'])).toBe('https://instagram.com/studio');
    expect(normalizeExternalUrl('https://m.facebook.com/studio', ['facebook.com'])).toBe('https://m.facebook.com/studio');
  });

  it.each(['javascript:alert(1)', 'data:text/html,test', 'http://instagram.com/studio', 'https://user:pass@instagram.com/studio'])(
    'rejects an unsafe link: %s',
    value => expect(() => normalizeExternalUrl(value, ['instagram.com'])).toThrow(),
  );

  it('rejects lookalike providers and omits unsafe persisted values', () => {
    expect(() => normalizeExternalUrl('https://instagram.com.evil.example/studio', ['instagram.com'])).toThrow('domínio');
    expect(safeExternalUrl('javascript:alert(1)')).toBeUndefined();
    expect(normalizeExternalUrl('')).toBeUndefined();
  });
});
