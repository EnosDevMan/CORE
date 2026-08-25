import type { PublicLayoutId, PublicLayoutPreset } from './types';

export const PUBLIC_LAYOUT_REGISTRY: Readonly<Record<PublicLayoutId, PublicLayoutPreset>> = {
  barber_bold: {
    id: 'barber_bold', name: 'Bold Service', heroVariant: 'bold_split', sectionStyle: 'structured',
    sectionOrder: ['features', 'services', 'professionals', 'gallery'],
  },
  beauty_editorial: {
    id: 'beauty_editorial', name: 'Editorial Beauty', heroVariant: 'editorial_center', sectionStyle: 'editorial',
    sectionOrder: ['gallery', 'services', 'professionals', 'features'],
  },
  nail_showcase: {
    id: 'nail_showcase', name: 'Studio Showcase', heroVariant: 'showcase', sectionStyle: 'showcase',
    sectionOrder: ['services', 'gallery', 'professionals', 'features'],
  },
  pet_friendly: {
    id: 'pet_friendly', name: 'Friendly Local', heroVariant: 'friendly', sectionStyle: 'friendly',
    sectionOrder: ['features', 'services', 'professionals', 'gallery'],
  },
};

export const getPublicLayoutPreset = (id: PublicLayoutId): PublicLayoutPreset => PUBLIC_LAYOUT_REGISTRY[id];
