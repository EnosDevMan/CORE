import type { NicheId, NichePreset } from './types';

const shared = ['online_booking', 'customers', 'professionals', 'services'] as const;

export const NICHE_REGISTRY: Readonly<Record<NicheId, NichePreset>> = {
  barbershop: {
    id: 'barbershop', name: 'Barbearia', professionalLabel: 'Barbeiros', customerLabel: 'Clientes',
    recommendedCapabilities: [...shared, 'loyalty'], recommendedThemeIds: ['minimal_light', 'premium_dark'],
    dashboard: { todayLabel: 'Clientes atendidos hoje', scheduleLabel: 'Agendamentos de hoje' },
    serviceSuggestions: [{ name: 'Corte', duration: 30, category: 'Cabelo' }, { name: 'Barba', duration: 30, category: 'Barba' }, { name: 'Corte + Barba', duration: 60, category: 'Combos' }],
  },
  beauty_salon: {
    id: 'beauty_salon', name: 'Salão de Beleza', professionalLabel: 'Profissionais', customerLabel: 'Clientes',
    recommendedCapabilities: shared, recommendedThemeIds: ['minimal_light', 'rose_elegance'],
    dashboard: { todayLabel: 'Atendimentos de hoje', scheduleLabel: 'Agenda do salão' },
    serviceSuggestions: [{ name: 'Escova', duration: 45, category: 'Cabelo' }, { name: 'Coloração', duration: 120, category: 'Cabelo' }, { name: 'Manicure', duration: 60, category: 'Unhas' }],
  },
  nail_studio: {
    id: 'nail_studio', name: 'Nail Studio', professionalLabel: 'Especialistas', customerLabel: 'Clientes',
    recommendedCapabilities: [...shared, 'loyalty'], recommendedThemeIds: ['minimal_light', 'lavender_studio'],
    dashboard: { todayLabel: 'Atendimentos de hoje', scheduleLabel: 'Agenda do studio' },
    serviceSuggestions: [{ name: 'Alongamento', duration: 120, category: 'Alongamento' }, { name: 'Manutenção', duration: 90, category: 'Manutenção' }, { name: 'Nail Art', duration: 60, category: 'Arte' }],
  },
  pet_shop: {
    id: 'pet_shop', name: 'Pet Shop', professionalLabel: 'Equipe', customerLabel: 'Tutores',
    recommendedCapabilities: [...shared, 'pets'], recommendedThemeIds: ['minimal_light', 'forest_clean'],
    dashboard: { todayLabel: 'Pets atendidos hoje', scheduleLabel: 'Pets agendados hoje' },
    serviceSuggestions: [{ name: 'Banho', duration: 60, category: 'Higiene' }, { name: 'Tosa', duration: 60, category: 'Estética' }, { name: 'Banho + Tosa', duration: 120, category: 'Combos' }],
  },
};

export function getNichePreset(id: NicheId): NichePreset {
  return NICHE_REGISTRY[id];
}
