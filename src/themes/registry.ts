import type { ThemeId, ThemeMode, ThemePersonality, ThemePreset, ThemeTokens } from './types';

const lightBase: ThemeTokens = {
  background: '#f8fafc', canvas: '#eef2f6', foreground: '#0f172a', surface: '#ffffff', surfaceElevated: '#ffffff',
  primary: '#1d4ed8', primaryForeground: '#ffffff', secondary: '#e2e8f0', secondaryForeground: '#0f172a',
  accent: '#f59e0b', accentForeground: '#111827', muted: '#f1f5f9', mutedForeground: '#475569',
  success: '#15803d', warning: '#b45309', danger: '#b91c1c', border: '#cbd5e1', input: '#ffffff', ring: '#2563eb',
  decorative: '#dbeafe', decorativeForeground: '#172554', nav: '#0f172a', navForeground: '#f8fafc',
  fontBody: 'Inter, ui-sans-serif, system-ui, sans-serif',
  fontDisplay: 'Inter, ui-sans-serif, system-ui, sans-serif', headingTracking: '-0.035em',
  radius: '0.75rem', cardRadius: '1rem', buttonRadius: '0.75rem',
  shadow: '0 10px 30px rgb(15 23 42 / 0.10)', shadowStrong: '0 24px 60px rgb(15 23 42 / 0.18)',
  heroGradient: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 55%, #fff7ed 100%)',
  surfaceGradient: 'linear-gradient(145deg, rgb(255 255 255 / .98), rgb(248 250 252 / .92))',
  pattern: 'radial-gradient(circle at 1px 1px, rgb(15 23 42 / .08) 1px, transparent 0)',
};

const darkBase: ThemeTokens = {
  ...lightBase,
  background: '#09090b', canvas: '#111318', foreground: '#fafafa', surface: '#18181b', surfaceElevated: '#27272a',
  secondary: '#27272a', secondaryForeground: '#fafafa', muted: '#27272a', mutedForeground: '#a1a1aa',
  border: '#3f3f46', input: '#18181b', decorative: '#2d2d31', decorativeForeground: '#fafafa',
  nav: '#070709', navForeground: '#fafafa', shadow: '0 14px 36px rgb(0 0 0 / 0.28)',
  shadowStrong: '0 28px 80px rgb(0 0 0 / .48)',
  surfaceGradient: 'linear-gradient(145deg, rgb(39 39 42 / .98), rgb(24 24 27 / .92))',
  pattern: 'radial-gradient(circle at 1px 1px, rgb(255 255 255 / .09) 1px, transparent 0)',
};

const preset = (
  id: ThemeId,
  name: string,
  description: string,
  personality: ThemePersonality,
  tokens: Partial<ThemeTokens>,
  mode: ThemeMode = 'light',
): ThemePreset => ({
  id, name, description, personality,
  mode,
  tokens: { ...(mode === 'dark' ? darkBase : lightBase), ...tokens },
});

export const THEME_REGISTRY: Readonly<Record<ThemeId, ThemePreset>> = {
  minimal_light: preset('minimal_light', 'Minimal Light', 'Claro, preciso e silencioso, com foco absoluto no conteúdo.', 'minimal', {
    primary: '#173d63', accent: '#e5a15f', ring: '#245b8f', canvas: '#edf2f6',
    decorative: '#dce9f2', decorativeForeground: '#173d63', nav: '#102b46',
    heroGradient: 'linear-gradient(135deg, #eef5fa 0%, #ffffff 58%, #fff3e7 100%)',
  }),
  graphite_modern: preset('graphite_modern', 'Graphite Modern', 'Tecnologia discreta, contraste limpo e detalhes turquesa.', 'industrial', {
    primary: '#334155', accent: '#32a6a0', accentForeground: '#062f2d', ring: '#217d79',
    background: '#f5f7f9', canvas: '#e9eef2', muted: '#edf1f4', decorative: '#d8e3e7', decorativeForeground: '#243744',
    nav: '#202c37', border: '#c7d1d9', buttonRadius: '.5rem', cardRadius: '.75rem', headingTracking: '-.045em',
    heroGradient: 'linear-gradient(145deg, #e8eef2 0%, #f9fafb 58%, #dff3f1 100%)',
    pattern: 'linear-gradient(rgb(51 65 85 / .07) 1px, transparent 1px), linear-gradient(90deg, rgb(51 65 85 / .07) 1px, transparent 1px)',
  }),
  premium_dark: preset('premium_dark', 'Premium Dark', 'Luxo contemporâneo com preto profundo, dourado e presença.', 'editorial', {
    primary: '#d7ae78', primaryForeground: '#24180c', accent: '#f0d6ad', accentForeground: '#2c1c0d', ring: '#e2bd8c',
    background: '#0b0c0f', canvas: '#101216', surface: '#15181d', surfaceElevated: '#1d2128', border: '#343941', muted: '#22262d',
    decorative: '#2b241c', decorativeForeground: '#f5e5cd', nav: '#07080a',
    fontDisplay: '"Arial Narrow", "Roboto Condensed", Impact, ui-sans-serif, sans-serif', headingTracking: '-.025em',
    radius: '.35rem', cardRadius: '.45rem', buttonRadius: '.2rem',
    heroGradient: 'linear-gradient(125deg, #08090b 0%, #15181d 58%, #2a2118 100%)',
    pattern: 'repeating-linear-gradient(135deg, transparent 0 10px, rgb(215 174 120 / .06) 10px 11px)',
  }, 'dark'),
  heritage_copper: preset('heritage_copper', 'Heritage Copper', 'Clássico artesanal, couro, cobre e tipografia de tradição.', 'heritage', {
    primary: '#db9560', primaryForeground: '#291408', accent: '#f0c996', accentForeground: '#2e1b0c', ring: '#e5a572',
    background: '#15100d', canvas: '#1b1410', surface: '#211915', surfaceElevated: '#2c211b', border: '#594031', muted: '#2a211c',
    decorative: '#38271e', decorativeForeground: '#f4dbc0', nav: '#100b09',
    fontDisplay: 'Georgia, "Times New Roman", serif', fontBody: '"Trebuchet MS", ui-sans-serif, sans-serif', headingTracking: '-.02em',
    radius: '.25rem', cardRadius: '.35rem', buttonRadius: '.2rem',
    heroGradient: 'linear-gradient(135deg, #120d0a 0%, #211813 62%, #4a2c1b 100%)',
    pattern: 'repeating-linear-gradient(90deg, rgb(255 255 255 / .025) 0 1px, transparent 1px 7px)',
  }, 'dark'),
  urban_steel: preset('urban_steel', 'Urban Steel', 'Urbano, energético e geométrico, inspirado em aço e neon.', 'industrial', {
    primary: '#9cb2c8', primaryForeground: '#101923', accent: '#35d1c5', accentForeground: '#063a36', ring: '#48ddd1',
    background: '#0d1521', canvas: '#111c2a', surface: '#172334', surfaceElevated: '#202f43', border: '#3a4b61', muted: '#1d2a3d',
    decorative: '#20384a', decorativeForeground: '#e5f7f5', nav: '#08101a',
    fontDisplay: '"Arial Narrow", "Trebuchet MS", ui-sans-serif, sans-serif', headingTracking: '-.045em',
    radius: '.2rem', cardRadius: '.3rem', buttonRadius: '.15rem',
    heroGradient: 'linear-gradient(120deg, #0b121d 0%, #17283b 58%, #0c4b4a 125%)',
    pattern: 'linear-gradient(rgb(156 178 200 / .08) 1px, transparent 1px), linear-gradient(90deg, rgb(156 178 200 / .08) 1px, transparent 1px)',
  }, 'dark'),
  rose_elegance: preset('rose_elegance', 'Rose Elegance', 'Editorial romântico, refinado e com bastante respiro.', 'romantic', {
    primary: '#a83a66', accent: '#f3c0d1', accentForeground: '#5d1834', ring: '#b94772',
    background: '#fff8fa', canvas: '#f8edf1', muted: '#f9e8ee', border: '#edcbd7', decorative: '#f4d8e2', decorativeForeground: '#6f2340',
    nav: '#5d2139', navForeground: '#fff8fa',
    fontDisplay: 'Georgia, "Times New Roman", serif', headingTracking: '-.025em',
    radius: '.75rem', cardRadius: '1.5rem', buttonRadius: '999px',
    heroGradient: 'linear-gradient(140deg, #fff8fa 0%, #fae7ee 58%, #f7d3df 100%)',
    pattern: 'radial-gradient(ellipse at center, rgb(168 58 102 / .08) 0 2px, transparent 2.5px)',
  }),
  champagne_blush: preset('champagne_blush', 'Champagne Blush', 'Luxo sereno em tons quentes, champanhe e porcelana.', 'soft_luxury', {
    primary: '#855b52', accent: '#dbb96f', accentForeground: '#392a12', ring: '#9c6b60',
    background: '#fffbf7', canvas: '#f5eee8', muted: '#f6ebe6', border: '#e4d2c8', decorative: '#eadccf', decorativeForeground: '#533b34',
    nav: '#4b3430', navForeground: '#fffaf7',
    fontDisplay: '"Palatino Linotype", Palatino, Georgia, serif', headingTracking: '-.03em',
    radius: '.5rem', cardRadius: '1.25rem', buttonRadius: '999px',
    heroGradient: 'linear-gradient(135deg, #fffaf5 0%, #f4e8df 60%, #edddbe 115%)',
    pattern: 'repeating-linear-gradient(115deg, transparent 0 22px, rgb(133 91 82 / .05) 22px 23px)',
  }),
  lavender_studio: preset('lavender_studio', 'Lavender Studio', 'Criativo e delicado, com lavanda elétrica e composição moderna.', 'creative', {
    primary: '#6e4bbb', accent: '#d4c3fb', accentForeground: '#3e2378', ring: '#7958c6',
    background: '#fbf9ff', canvas: '#f0ebfa', muted: '#f1eafd', border: '#ded1f5', decorative: '#e7dcfb', decorativeForeground: '#4b2e86',
    nav: '#3f2a69', navForeground: '#fcfaff',
    fontDisplay: '"Trebuchet MS", ui-sans-serif, sans-serif', headingTracking: '-.05em',
    radius: '1rem', cardRadius: '1.65rem', buttonRadius: '1rem',
    heroGradient: 'linear-gradient(135deg, #fbf8ff 0%, #ece3fb 55%, #ffdfe9 115%)',
    pattern: 'radial-gradient(circle, rgb(110 75 187 / .10) 0 2px, transparent 2.5px)',
  }),
  blush_glass: preset('blush_glass', 'Blush Glass', 'Vitrine glossy, translúcida e vibrante para trabalhos autorais.', 'glass', {
    primary: '#8546a2', accent: '#f08ba8', accentForeground: '#56122d', ring: '#9556af',
    background: '#fff8fc', canvas: '#f7eefa', surface: '#fffafd', surfaceElevated: '#ffffff', muted: '#f7e9fb', border: '#ebcdec',
    decorative: '#f5d8ea', decorativeForeground: '#592066', nav: '#4d205b', navForeground: '#fff9fd',
    fontDisplay: 'ui-rounded, "Arial Rounded MT Bold", "Trebuchet MS", sans-serif', headingTracking: '-.05em',
    radius: '1.15rem', cardRadius: '2rem', buttonRadius: '999px',
    shadow: '0 16px 45px rgb(133 70 162 / .12)', shadowStrong: '0 28px 80px rgb(133 70 162 / .22)',
    heroGradient: 'linear-gradient(125deg, #fff8fc 0%, #f5dff3 48%, #ded5ff 100%)',
    surfaceGradient: 'linear-gradient(145deg, rgb(255 255 255 / .86), rgb(255 248 252 / .64))',
    pattern: 'radial-gradient(circle at center, rgb(240 139 168 / .13) 0 3px, transparent 3.5px)',
  }),
  forest_clean: preset('forest_clean', 'Forest Clean', 'Natural, confiável e calmo, com verdes de cuidado.', 'organic', {
    primary: '#276749', accent: '#f1c453', accentForeground: '#3c2b08', ring: '#2f7c59',
    background: '#f7fbf7', canvas: '#e9f2e9', muted: '#e8f3ea', border: '#c8decf', decorative: '#d8eadb', decorativeForeground: '#19472f',
    nav: '#193f2f', navForeground: '#f5fff8',
    fontDisplay: '"Trebuchet MS", ui-sans-serif, sans-serif', headingTracking: '-.04em',
    radius: '1rem', cardRadius: '1.6rem', buttonRadius: '999px',
    heroGradient: 'linear-gradient(135deg, #f4fbf4 0%, #deeedf 58%, #fff2bf 120%)',
    pattern: 'radial-gradient(ellipse at center, rgb(39 103 73 / .10) 0 2px, transparent 2.5px)',
  }),
  ocean_playful: preset('ocean_playful', 'Ocean Playful', 'Fresco, simpático e cheio de movimento sem perder clareza.', 'playful', {
    primary: '#0d718d', accent: '#56d78b', accentForeground: '#073b25', ring: '#1686a4',
    background: '#f2fbff', canvas: '#e1f2f7', muted: '#e1f4fb', border: '#b9dfeb', decorative: '#ccecf4', decorativeForeground: '#0b5064',
    nav: '#0b5268', navForeground: '#f3fcff',
    fontDisplay: 'ui-rounded, "Arial Rounded MT Bold", "Trebuchet MS", sans-serif', headingTracking: '-.045em',
    radius: '1.15rem', cardRadius: '1.8rem', buttonRadius: '999px',
    heroGradient: 'linear-gradient(140deg, #effbff 0%, #d6f3f7 55%, #dcf8df 110%)',
    pattern: 'radial-gradient(circle, rgb(13 113 141 / .11) 0 2px, transparent 2.5px)',
  }),
  sunshine_pet: preset('sunshine_pet', 'Sunshine Pet', 'Quente, alegre e acolhedor, inspirado em dias de passeio.', 'sunny', {
    primary: '#b94314', accent: '#f5cc42', accentForeground: '#3f2a04', ring: '#d15321',
    background: '#fffaf2', canvas: '#f7edda', muted: '#ffedd8', border: '#f1d0a8', decorative: '#ffe0b7', decorativeForeground: '#6c2b11',
    nav: '#6f2c14', navForeground: '#fffaf3',
    fontDisplay: 'ui-rounded, "Arial Rounded MT Bold", "Trebuchet MS", sans-serif', headingTracking: '-.045em',
    radius: '1.1rem', cardRadius: '1.75rem', buttonRadius: '999px',
    heroGradient: 'linear-gradient(135deg, #fff9ef 0%, #ffead0 56%, #fff2a8 115%)',
    pattern: 'radial-gradient(circle, rgb(185 67 20 / .10) 0 2px, transparent 2.5px)',
  }),
};

export const getThemePreset = (id: ThemeId | string): ThemePreset =>
  THEME_REGISTRY[id as ThemeId] ?? THEME_REGISTRY.minimal_light;

export function toCssVariables(theme: ThemePreset): Record<string, string> {
  return Object.fromEntries(Object.entries(theme.tokens).map(([key, value]) => [
    `--core-${key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`,
    value,
  ]));
}
