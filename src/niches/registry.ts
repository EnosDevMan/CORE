import type { NicheId, NichePreset, RuntimeNicheId } from './types';

const shared = ['online_booking', 'customers', 'professionals', 'services'] as const;

/**
 * Internal-only preset for a fresh installation. It exists solely so shared
 * providers can render authentication/onboarding before a real business is
 * configured. Because it is not exported through `NICHE_REGISTRY`, it never
 * appears as an onboarding option and can never be persisted to Supabase.
 */
const CORE_BOOTSTRAP_NICHE: NichePreset<'core_bootstrap'> = {
  id: 'core_bootstrap',
  name: 'CORE',
  professionalLabel: 'Profissionais',
  customerLabel: 'Clientes',
  recommendedCapabilities: [],
  recommendedThemeIds: ['minimal_light'],
  dashboard: { todayLabel: 'Atendimentos de hoje', scheduleLabel: 'Agenda de hoje' },
  serviceSuggestions: [],
};

export const NICHE_REGISTRY: Readonly<Record<NicheId, NichePreset<NicheId>>> = {
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

export function getNichePreset(id: NicheId): NichePreset<NicheId>;
export function getNichePreset(id: 'core_bootstrap'): NichePreset<'core_bootstrap'>;
export function getNichePreset(id: RuntimeNicheId): NichePreset<RuntimeNicheId>;
export function getNichePreset(id: RuntimeNicheId): NichePreset<RuntimeNicheId> {
  return id === 'core_bootstrap' ? CORE_BOOTSTRAP_NICHE : NICHE_REGISTRY[id];
}
