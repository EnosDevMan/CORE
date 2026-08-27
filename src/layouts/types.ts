export type ThemeStyleId =
  | 'modern' | 'premium' | 'minimal'
  | 'heritage' | 'editorial' | 'showcase' | 'clean' | 'friendly';

export type LegacyPublicLayoutId = 'barber_bold' | 'beauty_editorial' | 'nail_showcase' | 'pet_friendly';
export type PublicLayoutId = ThemeStyleId;
export type PublicSectionId = 'features' | 'services' | 'gallery' | 'professionals';
export type HeroVariant =
  | 'modern_split' | 'premium_focus' | 'minimal_stack'
  | 'heritage_frame' | 'editorial_center' | 'showcase' | 'clean_split' | 'friendly';
export type SectionStyle = ThemeStyleId;

export interface ThemeStyleTokens {
  fontBody: string;
  fontDisplay: string;
  headingTracking: string;
  radius: string;
  cardRadius: string;
  buttonRadius: string;
  shadow: string;
  shadowStrong: string;
  pattern: string;
}

export interface PublicLayoutPreset {
  id: ThemeStyleId;
  name: string;
  description: string;
  heroVariant: HeroVariant;
  sectionStyle: SectionStyle;
  sectionOrder: readonly PublicSectionId[];
  tokens: ThemeStyleTokens;
}
