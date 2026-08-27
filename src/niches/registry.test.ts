import { describe, expect, it } from 'vitest';
import { THEME_STYLE_REGISTRY } from '../layouts/registry';
import { PALETTE_REGISTRY } from '../themes/paletteRegistry';
import { getNichePreset, NICHE_REGISTRY } from './registry';

describe('niche registry', () => {
  it('provides four persisted business niches through the same contract', () => {
    expect(Object.keys(NICHE_REGISTRY)).toEqual(['barbershop', 'beauty_salon', 'nail_studio', 'pet_shop']);
    expect(NICHE_REGISTRY.pet_shop.recommendedCapabilities).toContain('pets');
    expect(NICHE_REGISTRY.barbershop.recommendedCapabilities).not.toContain('pets');
  });

  it('keeps the CORE bootstrap niche out of persisted onboarding choices', () => {
    expect(Object.keys(NICHE_REGISTRY)).not.toContain('core_bootstrap');
    expect(getNichePreset('core_bootstrap')).toMatchObject({
      id: 'core_bootstrap',
      name: 'CORE',
      recommendedCapabilities: [],
      serviceSuggestions: [],
    });
  });

  it('keeps public fallback copy specific to each niche', () => {
    expect(NICHE_REGISTRY.nail_studio.landing.heroTitle).toBe('Seu estilo, em cada detalhe.');
    expect(NICHE_REGISTRY.nail_studio.landing.heroDescription).not.toMatch(/barba|corte/i);
    expect(NICHE_REGISTRY.pet_shop.landing.heroDescription).toMatch(/pet/i);
    expect(NICHE_REGISTRY.barbershop.landing.heroDescription).toMatch(/barba/i);
    expect(NICHE_REGISTRY.beauty_salon.landing.heroDescription).not.toMatch(/barba|pet/i);
  });

  it.each(Object.values(NICHE_REGISTRY))('$name exposes four styles and nine registered palettes', niche => {
    expect(niche.availableStyleIds).toHaveLength(4);
    expect(niche.availablePaletteIds.length).toBeGreaterThanOrEqual(9);
    for (const styleId of niche.availableStyleIds) expect(THEME_STYLE_REGISTRY[styleId]).toBeDefined();
    for (const paletteId of niche.availablePaletteIds) expect(PALETTE_REGISTRY[paletteId]).toBeDefined();
    expect(niche.availableStyleIds).toContain(niche.defaultStyleId);
    expect(niche.availablePaletteIds).toContain(niche.defaultPaletteId);
  });

  it.each(Object.values(NICHE_REGISTRY))('$name has complete onboarding and public defaults', niche => {
    expect(niche.serviceSuggestions.length).toBeGreaterThan(0);
    expect(niche.dashboard.todayLabel).toBeTruthy();
    expect(niche.dashboard.scheduleLabel).toBeTruthy();
    expect(niche.landing.eyebrow).toBeTruthy();
    expect(niche.landing.heroTitle).toBeTruthy();
    expect(niche.landing.heroDescription).toBeTruthy();
  });
});
