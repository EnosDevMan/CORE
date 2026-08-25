import { describe, expect, it } from 'vitest';
import { PUBLIC_LAYOUT_REGISTRY } from '../layouts/registry';
import { THEME_REGISTRY } from '../themes/registry';
import type { ThemeId } from '../themes/types';
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

  it('assigns a distinct default public layout to every persisted niche', () => {
    const layouts = Object.values(NICHE_REGISTRY).map(niche => niche.defaultLayoutId);
    expect(new Set(layouts).size).toBe(Object.keys(NICHE_REGISTRY).length);
    for (const layoutId of layouts) expect(PUBLIC_LAYOUT_REGISTRY[layoutId]).toBeDefined();
  });

  it.each(Object.values(NICHE_REGISTRY))('$name exposes only registered theme recommendations', niche => {
    expect(niche.recommendedThemeIds.length).toBeGreaterThanOrEqual(5);
    for (const themeId of niche.recommendedThemeIds) {
      expect(THEME_REGISTRY[themeId as ThemeId], `${niche.id}: ${themeId}`).toBeDefined();
    }
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
