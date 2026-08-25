export type PublicLayoutId = 'barber_bold' | 'beauty_editorial' | 'nail_showcase' | 'pet_friendly';
export type PublicSectionId = 'features' | 'services' | 'gallery' | 'professionals';
export type HeroVariant = 'bold_split' | 'editorial_center' | 'showcase' | 'friendly';
export type SectionStyle = 'structured' | 'editorial' | 'showcase' | 'friendly';

export interface PublicLayoutPreset {
  id: PublicLayoutId;
  name: string;
  description: string;
  heroVariant: HeroVariant;
  sectionStyle: SectionStyle;
  sectionOrder: readonly PublicSectionId[];
}
