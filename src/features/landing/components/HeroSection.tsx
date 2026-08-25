import React from 'react';
import { ArrowRight } from 'lucide-react';
import { BusinessConfig } from '../../../types';
import { useNiche } from '../../../core/business/hooks';
import { NicheMark } from '../NicheMark';

interface HeroSectionProps { config: BusinessConfig; onStartBooking: () => void; onOpenLogin: () => void; }

export const HeroSection: React.FC<HeroSectionProps> = ({ config, onStartBooking, onOpenLogin }) => {
  const niche = useNiche();
  return (
    <section className="core-public-primary px-4 py-14 sm:py-16 lg:py-24">
      <div className="mx-auto max-w-6xl lg:grid lg:grid-cols-[1fr_280px] lg:items-end lg:gap-16">
        <div className="max-w-3xl">
          <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] opacity-85">
            <NicheMark nicheId={niche.id} size={16} aria-hidden="true" /> {niche.landing.eyebrow}
          </p>
          <h1 className="max-w-2xl text-4xl font-black leading-[1.04] tracking-[-0.04em] sm:text-5xl lg:text-7xl">
            {config.heroTitle || niche.landing.heroTitle}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 opacity-80 sm:text-lg">
            {config.heroDescription || niche.landing.heroDescription}
          </p>
        </div>
        <div className="mt-8 flex w-full flex-col gap-3 lg:mt-0">
          <button id="hero-book-now-btn" onClick={onStartBooking} className="core-public-accent core-public-ring flex min-h-12 w-full items-center justify-center gap-2 px-6 py-3 font-bold transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2">
            Ver horários <ArrowRight size={18} aria-hidden="true" />
          </button>
          <button onClick={onOpenLogin} className="core-public-ring min-h-12 w-full border border-current px-6 py-3 font-semibold opacity-90 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2">Entrar</button>
        </div>
      </div>
    </section>
  );
};
