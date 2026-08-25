import React from 'react';
import { ArrowRight } from 'lucide-react';
import { BusinessConfig } from '../../../types';
import { useNiche } from '../../../core/business/hooks';
import type { HeroVariant } from '../../../layouts/types';
import { NicheMark } from '../NicheMark';

interface HeroSectionProps {
  config: BusinessConfig;
  onStartBooking: () => void;
  onOpenLogin: () => void;
  variant: HeroVariant;
}

const heroClasses: Record<HeroVariant, {
  section: string;
  inner: string;
  copy: string;
  title: string;
  description: string;
  actions: string;
  primaryButton: string;
}> = {
  bold_split: {
    section: 'core-public-primary px-4 py-14 sm:py-16 lg:py-24',
    inner: 'mx-auto max-w-6xl lg:grid lg:grid-cols-[1fr_280px] lg:items-end lg:gap-16',
    copy: 'max-w-3xl',
    title: 'max-w-2xl text-4xl font-black leading-[1.04] tracking-[-0.04em] sm:text-5xl lg:text-7xl',
    description: 'mt-5 max-w-xl text-base leading-7 opacity-80 sm:text-lg',
    actions: 'mt-8 flex w-full flex-col gap-3 lg:mt-0',
    primaryButton: 'core-public-accent',
  },
  editorial_center: {
    section: 'core-public-page px-4 py-16 sm:py-20 lg:py-28',
    inner: 'mx-auto max-w-5xl text-center',
    copy: 'mx-auto max-w-4xl',
    title: 'mx-auto max-w-3xl text-4xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-6xl lg:text-7xl',
    description: 'core-public-muted-text mx-auto mt-6 max-w-2xl text-base leading-8 sm:text-lg',
    actions: 'mx-auto mt-9 flex max-w-xl flex-col gap-3 sm:flex-row sm:justify-center',
    primaryButton: 'core-public-primary',
  },
  showcase: {
    section: 'core-public-secondary px-4 py-12 sm:py-16 lg:py-20',
    inner: 'core-public-elevated core-public-border mx-auto max-w-6xl border p-6 shadow-[var(--core-shadow)] sm:p-10 lg:grid lg:grid-cols-[1fr_260px] lg:items-center lg:gap-12',
    copy: 'max-w-3xl',
    title: 'max-w-2xl text-4xl font-black leading-[1.03] tracking-[-0.045em] sm:text-6xl',
    description: 'core-public-muted-text mt-5 max-w-xl text-base leading-7 sm:text-lg',
    actions: 'mt-8 flex w-full flex-col gap-3 lg:mt-0',
    primaryButton: 'core-public-primary',
  },
  friendly: {
    section: 'core-public-page px-4 py-10 sm:py-14 lg:py-20',
    inner: 'core-public-secondary core-public-border mx-auto max-w-6xl rounded-[calc(var(--core-radius)*2)] border p-6 sm:p-10 lg:grid lg:grid-cols-[1fr_280px] lg:items-center lg:gap-12',
    copy: 'max-w-3xl',
    title: 'max-w-2xl text-4xl font-black leading-[1.08] tracking-[-0.035em] sm:text-5xl lg:text-6xl',
    description: 'core-public-muted-text mt-5 max-w-xl text-base leading-7 sm:text-lg',
    actions: 'mt-8 flex w-full flex-col gap-3 lg:mt-0',
    primaryButton: 'core-public-primary',
  },
};

export const HeroSection: React.FC<HeroSectionProps> = ({ config, onStartBooking, onOpenLogin, variant }) => {
  const niche = useNiche();
  const classes = heroClasses[variant];
  const isCentered = variant === 'editorial_center';
  return (
    <section className={classes.section} data-hero-variant={variant}>
      <div className={classes.inner}>
        <div className={classes.copy}>
          <p className={`mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] ${isCentered ? 'justify-center core-public-primary-text' : 'opacity-85'}`}>
            <NicheMark nicheId={niche.id} size={16} aria-hidden="true" /> {niche.landing.eyebrow}
          </p>
          <h1 className={classes.title}>{config.heroTitle || niche.landing.heroTitle}</h1>
          <p className={classes.description}>{config.heroDescription || niche.landing.heroDescription}</p>
        </div>
        <div className={classes.actions}>
          <button id="hero-book-now-btn" onClick={onStartBooking} className={`${classes.primaryButton} core-public-ring flex min-h-12 w-full items-center justify-center gap-2 px-6 py-3 font-bold transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2`}>
            Ver horários <ArrowRight size={18} aria-hidden="true" />
          </button>
          <button onClick={onOpenLogin} className="core-public-ring min-h-12 w-full border border-current px-6 py-3 font-semibold opacity-90 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2">Entrar</button>
        </div>
      </div>
    </section>
  );
};
