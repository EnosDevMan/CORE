import type { PublicLayoutId, PublicLayoutPreset } from './types';

export const PUBLIC_LAYOUT_REGISTRY: Readonly<Record<PublicLayoutId, PublicLayoutPreset>> = {
  barber_bold: {
    id: 'barber_bold',
    name: 'Bold Service',
    description: 'Impacto forte, serviços em destaque e leitura rápida para negócios de atendimento recorrente.',
    heroVariant: 'bold_split',
    sectionStyle: 'structured',
    sectionOrder: ['features', 'services', 'professionals', 'gallery'],
  },
  beauty_editorial: {
    id: 'beauty_editorial',
    name: 'Editorial Beauty',
    description: 'Composição leve e sofisticada, valorizando portfólio, marca e serviços.',
    heroVariant: 'editorial_center',
    sectionStyle: 'editorial',
    sectionOrder: ['gallery', 'services', 'professionals', 'features'],
  },
  nail_showcase: {
    id: 'nail_showcase',
    name: 'Studio Showcase',
    description: 'Visual de studio com serviços e trabalhos em primeiro plano, ideal para portfólios detalhistas.',
    heroVariant: 'showcase',
    sectionStyle: 'showcase',
    sectionOrder: ['services', 'gallery', 'professionals', 'features'],
  },
  pet_friendly: {
    id: 'pet_friendly',
    name: 'Friendly Local',
    description: 'Estrutura acolhedora e objetiva, priorizando confiança, serviços e equipe.',
    heroVariant: 'friendly',
    sectionStyle: 'friendly',
    sectionOrder: ['features', 'services', 'professionals', 'gallery'],
  },
};

export const getPublicLayoutPreset = (id: PublicLayoutId): PublicLayoutPreset => PUBLIC_LAYOUT_REGISTRY[id];
