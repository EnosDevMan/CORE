import type { NicheId } from '../niches/types';
import type { LegacyPublicLayoutId, PublicLayoutPreset, ThemeStyleId, ThemeStyleTokens } from './types';

const systemSans = 'Inter, ui-sans-serif, system-ui, sans-serif';
const roundedSans = 'ui-rounded, "Arial Rounded MT Bold", "Trebuchet MS", sans-serif';
const editorialSerif = '"Palatino Linotype", Palatino, Georgia, serif';

export const THEME_STYLE_REGISTRY: Readonly<Record<ThemeStyleId, PublicLayoutPreset>> = {
  modern: {
    id: 'modern', name: 'Moderno', description: 'Direto, atual e comercial, com hierarquia forte e leitura rápida.',
    heroVariant: 'modern_split', sectionStyle: 'modern',
    sectionOrder: ['features', 'services', 'professionals', 'gallery'],
    tokens: {
      fontBody: systemSans, fontDisplay: systemSans, headingTracking: '-.045em',
      radius: '.8rem', cardRadius: '.95rem', buttonRadius: '.65rem',
      shadow: '0 10px 28px rgb(15 23 42 / .10)', shadowStrong: '0 24px 64px rgb(15 23 42 / .18)',
      pattern: 'linear-gradient(color-mix(in srgb, var(--core-primary) 7%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--core-primary) 7%, transparent) 1px, transparent 1px)',
    },
  },
  premium: {
    id: 'premium', name: 'Premium', description: 'Composição sofisticada, contraste marcante e percepção de alto valor.',
    heroVariant: 'premium_focus', sectionStyle: 'premium',
    sectionOrder: ['gallery', 'services', 'professionals', 'features'],
    tokens: {
      fontBody: systemSans, fontDisplay: editorialSerif, headingTracking: '-.025em',
      radius: '.45rem', cardRadius: '.65rem', buttonRadius: '.3rem',
      shadow: '0 16px 38px rgb(15 23 42 / .16)', shadowStrong: '0 32px 86px rgb(15 23 42 / .28)',
      pattern: 'repeating-linear-gradient(135deg, transparent 0 14px, color-mix(in srgb, var(--core-primary) 7%, transparent) 14px 15px)',
    },
  },
  minimal: {
    id: 'minimal', name: 'Minimalista', description: 'Muito respiro, poucos adornos e foco absoluto em conteúdo e ação.',
    heroVariant: 'minimal_stack', sectionStyle: 'minimal',
    sectionOrder: ['services', 'professionals', 'gallery', 'features'],
    tokens: {
      fontBody: systemSans, fontDisplay: systemSans, headingTracking: '-.05em',
      radius: '.35rem', cardRadius: '.4rem', buttonRadius: '.25rem',
      shadow: '0 1px 0 rgb(15 23 42 / .08)', shadowStrong: '0 12px 36px rgb(15 23 42 / .12)', pattern: 'none',
    },
  },
  heritage: {
    id: 'heritage', name: 'Heritage', description: 'Tradição artesanal, molduras fortes e ritmo clássico de barbearia.',
    heroVariant: 'heritage_frame', sectionStyle: 'heritage',
    sectionOrder: ['features', 'services', 'gallery', 'professionals'],
    tokens: {
      fontBody: '"Trebuchet MS", ui-sans-serif, sans-serif', fontDisplay: 'Georgia, "Times New Roman", serif', headingTracking: '-.018em',
      radius: '.2rem', cardRadius: '.25rem', buttonRadius: '.15rem',
      shadow: '0 12px 30px rgb(28 16 9 / .16)', shadowStrong: '0 28px 70px rgb(28 16 9 / .30)',
      pattern: 'repeating-linear-gradient(90deg, color-mix(in srgb, var(--core-primary) 6%, transparent) 0 1px, transparent 1px 8px)',
    },
  },
  editorial: {
    id: 'editorial', name: 'Editorial', description: 'Ritmo de revista, imagens verticais e tipografia de boutique.',
    heroVariant: 'editorial_center', sectionStyle: 'editorial',
    sectionOrder: ['gallery', 'services', 'professionals', 'features'],
    tokens: {
      fontBody: systemSans, fontDisplay: editorialSerif, headingTracking: '-.03em',
      radius: '.65rem', cardRadius: '1.2rem', buttonRadius: '999px',
      shadow: '0 14px 36px rgb(42 25 32 / .10)', shadowStrong: '0 30px 76px rgb(42 25 32 / .20)',
      pattern: 'repeating-linear-gradient(115deg, transparent 0 24px, color-mix(in srgb, var(--core-primary) 5%, transparent) 24px 25px)',
    },
  },
  showcase: {
    id: 'showcase', name: 'Showcase', description: 'Vitrine autoral, formas expressivas e portfólio em primeiro plano.',
    heroVariant: 'showcase', sectionStyle: 'showcase',
    sectionOrder: ['services', 'gallery', 'professionals', 'features'],
    tokens: {
      fontBody: systemSans, fontDisplay: roundedSans, headingTracking: '-.05em',
      radius: '1.1rem', cardRadius: '1.8rem', buttonRadius: '999px',
      shadow: '0 16px 44px rgb(58 35 90 / .12)', shadowStrong: '0 30px 82px rgb(58 35 90 / .22)',
      pattern: 'radial-gradient(circle, color-mix(in srgb, var(--core-primary) 11%, transparent) 0 2px, transparent 2.5px)',
    },
  },
  clean: {
    id: 'clean', name: 'Clean', description: 'Leve, organizado e acolhedor, com superfícies claras e objetivas.',
    heroVariant: 'clean_split', sectionStyle: 'clean',
    sectionOrder: ['features', 'services', 'professionals', 'gallery'],
    tokens: {
      fontBody: systemSans, fontDisplay: systemSans, headingTracking: '-.04em',
      radius: '1rem', cardRadius: '1.25rem', buttonRadius: '999px',
      shadow: '0 10px 30px rgb(20 60 50 / .09)', shadowStrong: '0 24px 64px rgb(20 60 50 / .16)', pattern: 'none',
    },
  },
  friendly: {
    id: 'friendly', name: 'Friendly', description: 'Orgânico, simpático e memorável, sem perder clareza comercial.',
    heroVariant: 'friendly', sectionStyle: 'friendly',
    sectionOrder: ['features', 'services', 'professionals', 'gallery'],
    tokens: {
      fontBody: systemSans, fontDisplay: roundedSans, headingTracking: '-.045em',
      radius: '1.2rem', cardRadius: '1.75rem', buttonRadius: '999px',
      shadow: '0 13px 34px rgb(20 60 70 / .11)', shadowStrong: '0 28px 72px rgb(20 60 70 / .20)',
      pattern: 'radial-gradient(circle, color-mix(in srgb, var(--core-primary) 10%, transparent) 0 2px, transparent 2.5px)',
    },
  },
};

type ArtDirectionOverride = Pick<PublicLayoutPreset, 'name' | 'description' | 'heroVariant' | 'sectionOrder'> & {
  tokens?: Partial<ThemeStyleTokens>;
};

/**
 * Persisted style IDs stay compact and compatible. Art direction is resolved
 * with the niche so the same structural family does not become a generic skin
 * copied across unrelated businesses.
 */
const NICHE_ART_DIRECTIONS: Readonly<Record<NicheId, Partial<Record<ThemeStyleId, ArtDirectionOverride>>>> = {
  barbershop: {
    modern: {
      name: 'Precision',
      description: 'Grade precisa, informação objetiva e fotografia firme para uma barbearia contemporânea.',
      heroVariant: 'barber_precision',
      sectionOrder: ['services', 'features', 'professionals', 'gallery'],
      tokens: { cardRadius: '.55rem', buttonRadius: '.32rem', headingTracking: '-.052em' },
    },
    premium: {
      name: 'Executive',
      description: 'Discreto e sofisticado, com foco em confiança, serviço premium e decisão rápida.',
      heroVariant: 'barber_executive',
      sectionOrder: ['features', 'services', 'gallery', 'professionals'],
      tokens: { cardRadius: '.35rem', buttonRadius: '.18rem', headingTracking: '-.018em' },
    },
    minimal: {
      name: 'Studio',
      description: 'Fotografia protagonista e linguagem urbana de estúdio, com menos molduras e mais portfólio.',
      heroVariant: 'barber_studio',
      sectionOrder: ['gallery', 'services', 'professionals', 'features'],
      tokens: { radius: '.15rem', cardRadius: '.15rem', buttonRadius: '.1rem', shadow: 'none' },
    },
    heritage: {
      name: 'Heritage',
      description: 'Tradição sem caricatura vintage: tipografia editorial, molduras e serviço tratado como ofício.',
      heroVariant: 'barber_heritage',
      sectionOrder: ['features', 'services', 'gallery', 'professionals'],
    },
  },
  beauty_salon: {
    modern: {
      name: 'Studio Modern',
      description: 'Comercial, leve e organizado, com serviços fáceis de comparar e agendamento sempre evidente.',
      heroVariant: 'beauty_studio_modern',
      sectionOrder: ['services', 'professionals', 'gallery', 'features'],
      tokens: { cardRadius: '1rem', buttonRadius: '999px', shadow: '0 10px 30px rgb(42 25 32 / .08)' },
    },
    premium: {
      name: 'Soft Luxury',
      description: 'Luxo silencioso, proporções amplas e imagem refinada sem depender de preto e dourado.',
      heroVariant: 'beauty_soft_luxury',
      sectionOrder: ['gallery', 'services', 'features', 'professionals'],
      tokens: { cardRadius: '.7rem', buttonRadius: '999px', headingTracking: '-.02em' },
    },
    minimal: {
      name: 'Signature',
      description: 'Marca e profissionais em primeiro plano, com composição limpa e sensação de atendimento autoral.',
      heroVariant: 'beauty_signature',
      sectionOrder: ['professionals', 'services', 'gallery', 'features'],
      tokens: { cardRadius: '.2rem', buttonRadius: '.2rem', shadow: '0 1px 0 rgb(15 23 42 / .08)' },
    },
    editorial: {
      name: 'Editorial',
      description: 'Direção de revista, fotografia vertical e ritmo de boutique para um salão com linguagem de moda.',
      heroVariant: 'beauty_editorial',
      sectionOrder: ['gallery', 'services', 'professionals', 'features'],
    },
  },
  nail_studio: {
    modern: {
      name: 'Clean Studio',
      description: 'Organização impecável e foco em técnica, confiança e escolha rápida do serviço.',
      heroVariant: 'nail_clean_studio',
      sectionOrder: ['services', 'features', 'gallery', 'professionals'],
      tokens: { cardRadius: '.85rem', buttonRadius: '.55rem', shadow: '0 8px 24px rgb(58 35 90 / .08)' },
    },
    premium: {
      name: 'Boutique',
      description: 'Detalhes sofisticados e experiência de marca, com acabamento delicado sem excesso decorativo.',
      heroVariant: 'nail_boutique',
      sectionOrder: ['gallery', 'services', 'professionals', 'features'],
      tokens: { cardRadius: '1.15rem', buttonRadius: '999px', headingTracking: '-.022em' },
    },
    minimal: {
      name: 'Editorial',
      description: 'Composição fashion de alto contraste, tipografia forte e portfólio tratado como campanha.',
      heroVariant: 'nail_editorial',
      sectionOrder: ['gallery', 'professionals', 'services', 'features'],
      tokens: { cardRadius: '.1rem', buttonRadius: '.1rem', shadow: 'none' },
    },
    showcase: {
      name: 'Showcase',
      description: 'Vitrine visual de trabalhos, com movimento de composição e galeria entrando cedo na experiência.',
      heroVariant: 'nail_showcase',
      sectionOrder: ['gallery', 'services', 'professionals', 'features'],
    },
  },
  pet_shop: {
    modern: {
      name: 'Modern Service',
      description: 'Funcional, profissional e direto: cuidado, serviços e agendamento aparecem sem ruído.',
      heroVariant: 'pet_modern_service',
      sectionOrder: ['services', 'features', 'professionals', 'gallery'],
      tokens: { cardRadius: '.8rem', buttonRadius: '.55rem', shadow: '0 8px 26px rgb(20 60 70 / .08)' },
    },
    clean: {
      name: 'Care',
      description: 'Higiene, segurança e transparência visual para transmitir cuidado antes de qualquer efeito decorativo.',
      heroVariant: 'pet_care',
      sectionOrder: ['features', 'services', 'professionals', 'gallery'],
      tokens: { cardRadius: '1rem', buttonRadius: '.75rem', pattern: 'none' },
    },
    minimal: {
      name: 'Organic',
      description: 'Bem-estar e calma com formas naturais, bastante respiro e fotografia real do cuidado.',
      heroVariant: 'pet_organic',
      sectionOrder: ['gallery', 'features', 'services', 'professionals'],
      tokens: { cardRadius: '1.4rem', buttonRadius: '999px', shadow: '0 6px 20px rgb(20 60 50 / .07)' },
    },
    friendly: {
      name: 'Friendly',
      description: 'Acolhedor e memorável sem infantilizar: curvas leves, proximidade e CTA claro para tutores.',
      heroVariant: 'pet_friendly',
      sectionOrder: ['features', 'services', 'gallery', 'professionals'],
    },
  },
};

/** Existing layout names remain resolvable for internal/external compatibility. */
export const LEGACY_PUBLIC_LAYOUT_MAP: Readonly<Record<LegacyPublicLayoutId, ThemeStyleId>> = {
  barber_bold: 'heritage',
  beauty_editorial: 'editorial',
  nail_showcase: 'showcase',
  pet_friendly: 'friendly',
};

export const PUBLIC_LAYOUT_REGISTRY = THEME_STYLE_REGISTRY;

export const getPublicLayoutPreset = (
  id: ThemeStyleId | LegacyPublicLayoutId | string,
  nicheId?: NicheId,
): PublicLayoutPreset => {
  const resolvedId = id in LEGACY_PUBLIC_LAYOUT_MAP
    ? LEGACY_PUBLIC_LAYOUT_MAP[id as LegacyPublicLayoutId]
    : id as ThemeStyleId;
  const base = THEME_STYLE_REGISTRY[resolvedId] ?? THEME_STYLE_REGISTRY.modern;
  const override = nicheId ? NICHE_ART_DIRECTIONS[nicheId]?.[base.id] : undefined;
  if (!override) return base;
  return {
    ...base,
    ...override,
    id: base.id,
    sectionStyle: base.id,
    tokens: { ...base.tokens, ...(override.tokens ?? {}) },
  };
};
