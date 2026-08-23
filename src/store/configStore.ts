import { create } from 'zustand';
import { BusinessConfig } from '../types';
import { dataService } from '../services/dataService';

interface ConfigState {
  config: BusinessConfig;
  setConfig: (config: BusinessConfig) => void;
  updateConfig: (updated: BusinessConfig) => Promise<void>;
}

/**
 * Estado inicial exibido só durante a fração de segundo antes do primeiro
 * carregamento real (`AppDataLoader`) responder. Nunca é salvo no banco;
 * assim que `loadAllData()` retorna, `setConfig` substitui isso pelo
 * registro real de `barbershop_config`.
 */
const PLACEHOLDER_CONFIG: BusinessConfig = {
  name: '',
  logo: '',
  address: '',
  phone: '',
  workingHours: { open: '09:00', close: '19:00', daysOpen: [1, 2, 3, 4, 5, 6] },
  socialLinks: {},
  bookingFee: 0,
  toleranceMinutes: 15,
  intervalMinutes: 30,
  bookingWindowDays: 3,
  minimumNoticeMinutes: 30,
  cancellationNoticeMinutes: 0,
};

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: PLACEHOLDER_CONFIG,
  setConfig: (config) => set({ config }),
  updateConfig: async (updated) => {
    const previous = get().config;
    set({ config: updated });
    try {
      await dataService.saveConfig(updated);
    } catch (err) {
      set({ config: previous });
      throw err;
    }
  }
}));
