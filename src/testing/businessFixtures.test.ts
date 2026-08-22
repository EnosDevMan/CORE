import { describe, expect, it } from 'vitest';
import { BUSINESS_FIXTURES } from './businessFixtures';

describe('universal business fixtures', () => {
  it('simulates all required niches with distinct operational data', () => {
    expect(new Set(BUSINESS_FIXTURES.map(item => item.profile.nicheId)).size).toBe(4);
    expect(new Set(BUSINESS_FIXTURES.map(item => item.profile.themeId)).size).toBe(4);
    expect(BUSINESS_FIXTURES.every(item => item.services.length > 0 && item.professionals.length > 0)).toBe(true);
  });
  it('enables pets only for the pet shop fixture', () => {
    expect(BUSINESS_FIXTURES.filter(item => item.capabilities.includes('pets')).map(item => item.profile.nicheId)).toEqual(['pet_shop']);
  });
});
