import { describe, it, expect } from 'vitest';
import { normalizePhoneForWhatsApp, buildWhatsAppLink } from './whatsapp';

describe('normalizePhoneForWhatsApp', () => {
  it('strips formatting and adds the 55 country code', () => {
    expect(normalizePhoneForWhatsApp('(11) 98765-4321')).toBe('5511987654321');
  });

  it('keeps the country code if already present', () => {
    expect(normalizePhoneForWhatsApp('5511987654321')).toBe('5511987654321');
  });

  it('returns an empty string for empty/garbage input instead of "55"', () => {
    expect(normalizePhoneForWhatsApp('')).toBe('');
    expect(normalizePhoneForWhatsApp('abc')).toBe('');
  });
});

describe('buildWhatsAppLink', () => {
  it('builds a wa.me link with the message url-encoded', () => {
    const link = buildWhatsAppLink('11987654321', 'Olá!');
    expect(link).toBe('https://wa.me/5511987654321?text=Ol%C3%A1!');
  });

  it('returns null instead of a broken link when there is no usable phone (regression: barber dashboard used to render a dead wa.me/ link)', () => {
    expect(buildWhatsAppLink('', 'Olá!')).toBeNull();
    expect(buildWhatsAppLink('abc', 'Olá!')).toBeNull();
  });
});
