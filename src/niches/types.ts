import type { Capability } from '../core/business/types';

export type NicheId = 'barbershop' | 'beauty_salon' | 'nail_studio' | 'pet_shop';

export interface NichePreset {
  id: NicheId;
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
