import type { LegacyPublicLayoutId, PublicLayoutPreset, ThemeStyleId } from './types';

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

/** Existing layout names remain resolvable for internal/external compatibility. */
export const LEGACY_PUBLIC_LAYOUT_MAP: Readonly<Record<LegacyPublicLayoutId, ThemeStyleId>> = {
  barber_bold: 'heritage',
  beauty_editorial: 'editorial',
  nail_showcase: 'showcase',
  pet_friendly: 'friendly',
};

export const PUBLIC_LAYOUT_REGISTRY = THEME_STYLE_REGISTRY;

export const getPublicLayoutPreset = (id: ThemeStyleId | LegacyPublicLayoutId | string): PublicLayoutPreset => {
  const resolvedId = id in LEGACY_PUBLIC_LAYOUT_MAP
    ? LEGACY_PUBLIC_LAYOUT_MAP[id as LegacyPublicLayoutId]
    : id as ThemeStyleId;
  return THEME_STYLE_REGISTRY[resolvedId] ?? THEME_STYLE_REGISTRY.modern;
};
