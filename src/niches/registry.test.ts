import { describe, expect, it } from 'vitest';
import { NICHE_REGISTRY } from './registry';

describe('niche registry', () => {
  it('provides four independent configurations through the same contract', () => {
    expect(Object.keys(NICHE_REGISTRY)).toEqual(['barbershop', 'beauty_salon', 'nail_studio', 'pet_shop']);
    expect(NICHE_REGISTRY.pet_shop.recommendedCapabilities).toContain('pets');
    expect(NICHE_REGISTRY.barbershop.recommendedCapabilities).not.toContain('pets');
  });
  it.each(Object.values(NICHE_REGISTRY))('$name has editable onboarding suggestions', niche => {
    expect(niche.serviceSuggestions.length).toBeGreaterThan(0);
    expect(niche.recommendedThemeIds.length).toBeGreaterThan(0);
    expect(niche.dashboard.todayLabel).toBeTruthy();
    expect(niche.dashboard.scheduleLabel).toBeTruthy();
  });
});
