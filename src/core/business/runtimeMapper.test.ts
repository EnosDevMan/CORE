import { describe, expect, it } from 'vitest';
import { mapBusinessProfile, mapCapabilities } from './runtimeMapper';

const validProfile = {
  business_name: 'Studio Demo',
  description: null,
  logo_url: null,
  favicon_url: null,
  cover_url: null,
  phone: null,
  whatsapp: null,
  email: null,
  address: { formatted: 'Rua Exemplo, 10' },
  timezone: 'America/Sao_Paulo',
  currency: 'BRL',
  locale: 'pt-BR',
  niche_id: 'beauty_salon',
  theme_id: 'rose_elegance',
};

describe('business runtime mapper', () => {
  it('maps a validated database profile', () => {
    expect(mapBusinessProfile(validProfile)).toMatchObject({
      name: 'Studio Demo',
      nicheId: 'beauty_salon',
      themeId: 'rose_elegance',
      address: 'Rua Exemplo, 10',
    });
  });

  it('maps the uploaded brand assets', () => {
    expect(mapBusinessProfile({
      ...validProfile,
      logo_url: 'https://example.test/logo.webp',
      favicon_url: 'https://example.test/favicon.webp',
    })).toMatchObject({
      logoUrl: 'https://example.test/logo.webp',
      faviconUrl: 'https://example.test/favicon.webp',
    });
  });

  it.each([
    [{ ...validProfile, niche_id: 'clinic' }, /Nicho desconhecido/],
    [{ ...validProfile, timezone: 'Mars/Olympus' }, /Fuso horário inválido/],
    [{ ...validProfile, business_name: '  ' }, /business_name/],
  ])('rejects an unsafe runtime profile', (profile, error) => {
    expect(() => mapBusinessProfile(profile)).toThrow(error);
  });

  it('maps a legacy theme and falls back safely from missing or unknown appearance IDs', () => {
    expect(mapBusinessProfile(validProfile)).toMatchObject({
      themeStyleId: 'editorial',
      paletteId: 'rose',
    });
    expect(mapBusinessProfile({
      ...validProfile,
      theme_id: 'removed_theme',
      theme_style_id: 'removed_style',
      palette_id: 'removed_palette',
    })).toMatchObject({
      themeId: 'rose_elegance',
      themeStyleId: 'editorial',
      paletteId: 'rose',
    });
  });

  it('preserves independent explicit style and palette choices after reload', () => {
    expect(mapBusinessProfile({
      ...validProfile,
      theme_style_id: 'minimal',
      palette_id: 'lavender',
    })).toMatchObject({ themeStyleId: 'minimal', paletteId: 'lavender' });
  });

  it('deduplicates known capabilities and rejects unknown flags', () => {
    expect(mapCapabilities([
      { capability: 'services' }, { capability: 'pets' }, { capability: 'pets' },
    ])).toEqual(['services', 'pets']);
    expect(() => mapCapabilities([{ capability: 'root_access' }])).toThrow(/desconhecida/);
  });
});
