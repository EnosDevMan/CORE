import type { CSSProperties } from 'react';
import type { HeroVariant } from '../../layouts/types';

export interface HeroVisualDirection {
  container?: CSSProperties;
  media?: CSSProperties;
  stamp?: CSSProperties;
  note?: CSSProperties;
  availability?: CSSProperties;
  hideStamp?: boolean;
  hideNote?: boolean;
  hideAvailability?: boolean;
  hideOrbits?: boolean;
}

export interface HeroArtDirection {
  section?: CSSProperties;
  inner?: CSSProperties;
  copy?: CSSProperties;
  brand?: CSSProperties;
  eyebrow?: CSSProperties;
  title?: CSSProperties;
  description?: CSSProperties;
  actions?: CSSProperties;
  assurances?: CSSProperties;
  visual?: HeroVisualDirection;
}

const cleanVisual: HeroVisualDirection = { hideStamp: true, hideOrbits: true };
const editorialCenter: Pick<HeroArtDirection, 'copy' | 'brand' | 'eyebrow' | 'actions' | 'assurances'> = {
  copy: { marginInline: 'auto', textAlign: 'center' },
  brand: { justifyContent: 'center' },
  eyebrow: { justifyContent: 'center' },
  actions: { justifyContent: 'center' },
  assurances: { justifyContent: 'center' },
};

const DIRECTIONS: Partial<Record<HeroVariant, HeroArtDirection>> = {
  barber_precision: {
    section: { background: 'var(--core-background)', borderBottom: '1px solid var(--core-border)' },
    inner: { gap: '2rem' },
    title: { maxWidth: '37rem', fontWeight: 900, lineHeight: .92, textTransform: 'uppercase' },
    eyebrow: { letterSpacing: '.26em' },
    visual: {
      ...cleanVisual,
      container: { minHeight: '25rem' },
      media: { inset: '0 0 2rem 1.5rem', borderRadius: '.15rem', boxShadow: 'none' },
      hideNote: true,
      availability: { right: 'auto', bottom: '.2rem', left: 0, borderRadius: '.12rem', backdropFilter: 'none' },
    },
  },
  barber_executive: {
    section: { background: 'linear-gradient(120deg,var(--core-background),var(--core-canvas))', borderBottom: '1px solid var(--core-border)' },
    title: { maxWidth: '38rem', fontWeight: 560, lineHeight: 1.02 },
    description: { maxWidth: '32rem' },
    visual: {
      ...cleanVisual,
      container: { minHeight: '31rem' },
      media: { inset: '1rem 0 1rem 5rem', borderRadius: 0 },
      hideNote: true,
      availability: { right: 'auto', bottom: 0, left: '1.4rem', borderRadius: 0 },
    },
  },
  barber_studio: {
    section: { paddingBottom: '2.5rem', background: 'var(--core-background)' },
    title: { fontSize: 'clamp(3rem,11vw,5.4rem)', fontWeight: 900, lineHeight: .88 },
    description: { maxWidth: '29rem' },
    visual: {
      container: { width: '100%', minHeight: '30rem', maxWidth: '38rem' },
      media: { inset: 0, border: 0, borderRadius: 0, boxShadow: 'none' },
      hideStamp: true,
      hideNote: true,
      hideAvailability: true,
      hideOrbits: true,
    },
  },
  barber_heritage: {
    section: { background: 'var(--core-background)', borderBlock: '4px double var(--core-primary)' },
    copy: { padding: '1.5rem', outline: '1px solid var(--core-border)', outlineOffset: '-.5rem' },
    title: { fontWeight: 600, lineHeight: .98, textTransform: 'uppercase' },
    visual: {
      container: { minHeight: '29rem' },
      media: { inset: '1rem 1.5rem 3rem', border: '3px double var(--core-border)', borderRadius: 0 },
      stamp: { borderRadius: 0 },
      note: { borderRadius: 0 },
      hideOrbits: true,
    },
  },

  beauty_studio_modern: {
    section: { background: 'var(--core-hero-gradient)' },
    visual: {
      ...cleanVisual,
      media: { inset: '1rem .5rem 2.2rem 3rem', borderRadius: '2.8rem .8rem 2.8rem .8rem', boxShadow: 'var(--core-shadow)' },
      note: { top: 'auto', bottom: '.5rem', borderRadius: '999px' },
    },
  },
  beauty_soft_luxury: {
    section: { background: 'var(--core-background)', textAlign: 'center' },
    inner: { maxWidth: '68rem', gridTemplateColumns: '1fr', gap: '2rem' },
    ...editorialCenter,
    title: { maxWidth: '52rem', marginInline: 'auto', fontWeight: 520, fontSize: 'clamp(3rem,9vw,5.3rem)' },
    description: { marginInline: 'auto' },
    visual: {
      container: { width: '100%', maxWidth: '62rem', minHeight: '25rem' },
      media: { inset: '0 5%', borderRadius: '10rem 10rem .7rem .7rem' },
      hideStamp: true,
      hideNote: true,
      hideAvailability: true,
      hideOrbits: true,
    },
  },
  beauty_signature: {
    section: { background: 'var(--core-background)' },
    title: { maxWidth: '34rem', fontSize: 'clamp(3.2rem,10vw,5rem)', fontWeight: 650 },
    visual: {
      container: { width: 'min(100%,25rem)', minHeight: '33rem' },
      media: { inset: 0, borderRadius: 0, boxShadow: 'none' },
      hideStamp: true,
      hideNote: true,
      hideOrbits: true,
      availability: { right: '-1.5rem', bottom: '2rem', borderRadius: 0 },
    },
  },
  beauty_editorial: {
    section: { background: 'var(--core-background)' },
    ...editorialCenter,
    title: { maxWidth: '50rem', marginInline: 'auto', fontSize: 'clamp(3.4rem,11vw,6rem)', fontWeight: 500 },
    description: { maxWidth: '34rem', marginInline: 'auto' },
    visual: {
      media: { inset: '1rem 4rem 2rem', borderRadius: '50% 50% .5rem .5rem / 24% 24% .5rem .5rem' },
      hideStamp: true,
      hideNote: true,
      hideOrbits: true,
    },
  },

  nail_clean_studio: {
    section: { background: 'var(--core-background)', borderBottom: '1px solid var(--core-border)' },
    visual: {
      ...cleanVisual,
      container: { minHeight: '25rem' },
      media: { inset: '1rem 1rem 2rem 2.5rem', borderRadius: '.8rem', boxShadow: 'none' },
      note: { borderRadius: '.55rem', backdropFilter: 'none' },
    },
  },
  nail_boutique: {
    section: { background: 'linear-gradient(145deg,var(--core-background),var(--core-canvas))' },
    title: { fontWeight: 560 },
    visual: {
      media: { inset: '1rem 2.5rem 2.5rem', borderRadius: '8rem 8rem 1.2rem 1.2rem' },
      stamp: { width: '3.4rem', height: '3.4rem' },
      hideOrbits: true,
    },
  },
  nail_editorial: {
    section: { background: 'var(--core-background)', borderBlock: '1px solid var(--core-border)' },
    title: { maxWidth: '41rem', fontSize: 'clamp(3.4rem,12vw,6.2rem)', fontWeight: 900, lineHeight: .84, textTransform: 'uppercase' },
    visual: {
      container: { minHeight: '31rem' },
      media: { inset: 0, border: 0, borderRadius: 0, boxShadow: 'none' },
      hideStamp: true,
      hideNote: true,
      hideAvailability: true,
      hideOrbits: true,
    },
  },
  nail_showcase: {
    section: { background: 'var(--core-hero-gradient)' },
    visual: {
      media: { inset: '1.2rem 2rem 3rem', borderRadius: '45% 55% 37% 63% / 53% 37% 63% 47%', transform: 'rotate(-2deg)' },
      stamp: { transform: 'rotate(6deg)' },
      note: { transform: 'rotate(-2deg)' },
      availability: { transform: 'rotate(2deg)' },
    },
  },

  pet_modern_service: {
    section: { background: 'var(--core-background)', borderBottom: '1px solid var(--core-border)' },
    title: { maxWidth: '38rem', fontWeight: 880 },
    visual: {
      ...cleanVisual,
      media: { inset: '.6rem 0 2rem 2rem', borderRadius: '1rem', boxShadow: 'none' },
      availability: { borderRadius: '.65rem' },
    },
  },
  pet_care: {
    section: { background: 'linear-gradient(135deg,var(--core-background),var(--core-canvas))' },
    title: { fontSize: 'clamp(2.8rem,9vw,4.4rem)' },
    visual: {
      ...cleanVisual,
      media: { inset: '1rem 1rem 3rem', borderRadius: '1.4rem', boxShadow: 'var(--core-shadow)' },
      note: { top: 'auto', bottom: '.4rem', borderRadius: '.8rem' },
    },
  },
  pet_organic: {
    section: { background: 'var(--core-background)' },
    copy: { maxWidth: '39rem' },
    visual: {
      container: { minHeight: '28rem' },
      media: { inset: '0 1rem 2rem', borderRadius: '47% 53% 44% 56% / 58% 44% 56% 42%', boxShadow: 'none' },
      hideStamp: true,
      hideNote: true,
      hideOrbits: true,
      availability: { right: 'auto', left: '.5rem', borderRadius: '999px' },
    },
  },
  pet_friendly: {
    section: { background: 'var(--core-hero-gradient)' },
    visual: {
      media: { inset: '1rem 1.8rem 3rem', borderRadius: '44% 56% 48% 52% / 55% 42% 58% 45%', transform: 'rotate(1.5deg)' },
      stamp: { borderRadius: '44% 56% 46% 54%', transform: 'rotate(-5deg)' },
      note: { transform: 'rotate(-1.5deg)' },
    },
  },
};

export const getHeroArtDirection = (variant: HeroVariant): HeroArtDirection => DIRECTIONS[variant] ?? {};
