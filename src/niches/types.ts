import type { Capability } from '../core/business/types';

export type NicheId = 'barbershop' | 'beauty_salon' | 'nail_studio' | 'pet_shop';

/**
 * Runtime-only niche used while a fresh installation has not been configured.
 * It is intentionally not part of `NicheId`, so it can never be persisted by
 * the onboarding flow or sent to the database enum.
 */
export type RuntimeNicheId = NicheId | 'core_bootstrap';

export interface NichePreset<Id extends RuntimeNicheId = NicheId> {
  id: Id;
  name: string;
  professionalLabel: string;
  customerLabel: string;
  recommendedCapabilities: readonly Capability[];
  serviceSuggestions: readonly { name: string; duration: number; category: string }[];
  recommendedThemeIds: readonly string[];
  dashboard: {
    todayLabel: string;
    scheduleLabel: string;
  };
}
