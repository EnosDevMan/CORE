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
  defaultLayoutId: 'barber_bold',
  dashboard: { todayLabel: 'Atendimentos de hoje', scheduleLabel: 'Agenda de hoje' },
  serviceSuggestions: [],
  landing: {
    eyebrow: 'Agendamento online',
    heroTitle: 'Atendimento no seu horário.',
    heroDescription: 'Escolha o serviço, o profissional e o melhor horário para você.',
    servicesTitle: 'Escolha seu serviço',
    professionalsTitle: 'Conheça nossa equipe',
    galleryTitle: 'Conheça nosso trabalho',
  },
};

export const NICHE_REGISTRY: Readonly<Record<NicheId, NichePreset<NicheId>>> = {
  barbershop: {
    id: 'barbershop', name: 'Barbearia', professionalLabel: 'Barbeiros', customerLabel: 'Clientes',
    recommendedCapabilities: [...shared, 'loyalty'],
    recommendedThemeIds: ['premium_dark', 'heritage_copper', 'urban_steel', 'minimal_light', 'graphite_modern'],
    defaultLayoutId: 'barber_bold',
    dashboard: { todayLabel: 'Clientes atendidos hoje', scheduleLabel: 'Agendamentos de hoje' },
    landing: {
      eyebrow: 'Agendamento online',
      heroTitle: 'Seu corte, no seu horário.',
      heroDescription: 'Cabelo e barba com atendimento próximo, cuidado nos detalhes e horário marcado.',
      servicesTitle: 'Escolha seu cuidado',
      professionalsTitle: 'Conheça nossos barbeiros',
      galleryTitle: 'Trabalhos da casa',
    },
    serviceSuggestions: [{ name: 'Corte', duration: 30, category: 'Cabelo' }, { name: 'Barba', duration: 30, category: 'Barba' }, { name: 'Corte + Barba', duration: 60, category: 'Combos' }],
  },
  beauty_salon: {
    id: 'beauty_salon', name: 'Salão de Beleza', professionalLabel: 'Profissionais', customerLabel: 'Clientes',
    recommendedCapabilities: shared,
    recommendedThemeIds: ['rose_elegance', 'champagne_blush', 'sage_luxe', 'lavender_studio', 'minimal_light'],
    defaultLayoutId: 'beauty_editorial',
    dashboard: { todayLabel: 'Atendimentos de hoje', scheduleLabel: 'Agenda do salão' },
    landing: {
      eyebrow: 'Beleza com hora marcada',
      heroTitle: 'Seu cuidado, no seu tempo.',
      heroDescription: 'Cabelo, beleza e bem-estar com atendimento profissional e horário reservado para você.',
      servicesTitle: 'Escolha seu cuidado',
      professionalsTitle: 'Conheça nossos profissionais',
      galleryTitle: 'Resultados e inspirações',
    },
    serviceSuggestions: [{ name: 'Escova', duration: 45, category: 'Cabelo' }, { name: 'Coloração', duration: 120, category: 'Cabelo' }, { name: 'Manicure', duration: 60, category: 'Unhas' }],
  },
  nail_studio: {
    id: 'nail_studio', name: 'Nail Studio', professionalLabel: 'Especialistas', customerLabel: 'Clientes',
    recommendedCapabilities: [...shared, 'loyalty'],
    recommendedThemeIds: ['lavender_studio', 'blush_glass', 'cocoa_nude', 'rose_elegance', 'minimal_light'],
    defaultLayoutId: 'nail_showcase',
    dashboard: { todayLabel: 'Atendimentos de hoje', scheduleLabel: 'Agenda do studio' },
    landing: {
      eyebrow: 'Unhas com hora marcada',
      heroTitle: 'Seu estilo, em cada detalhe.',
      heroDescription: 'Cuidados para suas unhas com técnica, criatividade e um horário reservado para você.',
      servicesTitle: 'Escolha seu cuidado',
      professionalsTitle: 'Conheça nossas especialistas',
      galleryTitle: 'Inspirações do studio',
    },
    serviceSuggestions: [{ name: 'Alongamento', duration: 120, category: 'Alongamento' }, { name: 'Manutenção', duration: 90, category: 'Manutenção' }, { name: 'Nail Art', duration: 60, category: 'Arte' }],
  },
  pet_shop: {
    id: 'pet_shop', name: 'Pet Shop', professionalLabel: 'Equipe', customerLabel: 'Tutores',
    recommendedCapabilities: [...shared, 'pets'],
    recommendedThemeIds: ['forest_clean', 'ocean_playful', 'sunshine_pet', 'minimal_light', 'graphite_modern'],
    defaultLayoutId: 'pet_friendly',
    dashboard: { todayLabel: 'Pets atendidos hoje', scheduleLabel: 'Pets agendados hoje' },
    landing: {
      eyebrow: 'Cuidado pet com hora marcada',
      heroTitle: 'Cuidado para quem faz parte da família.',
      heroDescription: 'Banho, tosa e bem-estar para o seu pet com atendimento organizado e horário reservado.',
      servicesTitle: 'Escolha o cuidado do seu pet',
      professionalsTitle: 'Conheça nossa equipe',
      galleryTitle: 'Momentos e cuidados',
    },
    serviceSuggestions: [{ name: 'Banho', duration: 60, category: 'Higiene' }, { name: 'Tosa', duration: 60, category: 'Estética' }, { name: 'Banho + Tosa', duration: 120, category: 'Combos' }],
  },
};

export function getNichePreset(id: NicheId): NichePreset<NicheId>;
export function getNichePreset(id: 'core_bootstrap'): NichePreset<'core_bootstrap'>;
export function getNichePreset(id: RuntimeNicheId): NichePreset<RuntimeNicheId>;
export function getNichePreset(id: RuntimeNicheId): NichePreset<RuntimeNicheId> {
  return id === 'core_bootstrap' ? CORE_BOOTSTRAP_NICHE : NICHE_REGISTRY[id];
}
