import { describe, expect, it } from 'vitest';
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

  it.each(Object.values(NICHE_REGISTRY))('$name has editable onboarding suggestions', niche => {
    expect(niche.serviceSuggestions.length).toBeGreaterThan(0);
    expect(niche.recommendedThemeIds.length).toBeGreaterThan(0);
    expect(niche.dashboard.todayLabel).toBeTruthy();
    expect(niche.dashboard.scheduleLabel).toBeTruthy();
  });
});
