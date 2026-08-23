import type { WorkingHours } from '../booking/types';

/** Shared internal entity. Niche presets decide how this name is presented. */
export interface Professional {
  id: string;
  name: string;
  avatar: string;
  specialty: string;
  active: boolean;
  workingHours?: WorkingHours;
  description?: string;
  order?: number;
  userId?: string;
}
