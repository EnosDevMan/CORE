import { describe, expect, it } from 'vitest';
import { NICHE_REGISTRY } from '../niches/registry';
import {
  getLegacyThemeIdForAppearance,
  isAppearanceAvailableForNiche,
  resolveAppearanceForNiche,
} from './appearance';

describe('appearance resolution', () => {
  it.each(Object.values(NICHE_REGISTRY))('$name accepts its declared 4 × 9 matrix', niche => {
    expect(niche.availableStyleIds).toHaveLength(4);
    expect(niche.availablePaletteIds).toHaveLength(9);
    for (const styleId of niche.availableStyleIds) {
      for (const paletteId of niche.availablePaletteIds) {
        expect(isAppearanceAvailableForNiche(niche.id, styleId, paletteId)).toBe(true);
      }
    }
  });

  it('rejects cross-niche combinations and falls back by independent dimension', () => {
    expect(isAppearanceAvailableForNiche('pet_shop', 'heritage', 'forest')).toBe(false);
    expect(resolveAppearanceForNiche('pet_shop', {
      styleId: 'heritage',
      paletteId: 'ocean',
    })).toEqual({ styleId: 'friendly', paletteId: 'ocean' });
    expect(resolveAppearanceForNiche('nail_studio', {
      styleId: 'minimal',
      paletteId: 'unknown',
    })).toEqual({ styleId: 'minimal', paletteId: 'lavender' });
  });

  it('maps every legacy family to an equivalent niche-safe appearance', () => {
    expect(resolveAppearanceForNiche('barbershop', { legacyThemeId: 'heritage_copper' }))
      .toEqual({ styleId: 'heritage', paletteId: 'copper' });
    expect(resolveAppearanceForNiche('beauty_salon', { legacyThemeId: 'graphite_modern' }))
      .toEqual({ styleId: 'modern', paletteId: 'slate' });
    expect(resolveAppearanceForNiche('nail_studio', { legacyThemeId: 'lavender_studio' }))
      .toEqual({ styleId: 'showcase', paletteId: 'lavender' });
    expect(resolveAppearanceForNiche('pet_shop', { legacyThemeId: 'sunshine_pet' }))
      .toEqual({ styleId: 'friendly', paletteId: 'soft_yellow' });
  });

  it('always produces a stable theme_id alias for older clients', () => {
    expect(getLegacyThemeIdForAppearance('barbershop', 'minimal', 'forest')).toBe('forest_clean');
    expect(getLegacyThemeIdForAppearance('nail_studio', 'showcase', 'lavender')).toBe('lavender_studio');
  });
});
