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

export const HeroSection: React.FC<HeroSectionProps> = ({ config, onStartBooking, onOpenLogin, variant }) => {
  const niche = useNiche();
  return (
    <section className="core-hero" data-hero-variant={variant}>
      <div className="core-hero__inner">
        <div className="core-hero__copy">
          <p className="core-hero__eyebrow">
            <NicheMark nicheId={niche.id} size={16} aria-hidden="true" /> {niche.landing.eyebrow}
          </p>
          <h1 className="core-hero__title">{config.heroTitle || niche.landing.heroTitle}</h1>
          <p className="core-hero__description">{config.heroDescription || niche.landing.heroDescription}</p>
        </div>
        <div className="core-hero__actions">
          <button id="hero-book-now-btn" onClick={onStartBooking} className="core-hero__primary core-public-ring">
            Ver horários <ArrowRight size={18} aria-hidden="true" />
          </button>
          <button onClick={onOpenLogin} className="core-hero__login core-public-ring">Entrar</button>
        </div>
      </div>
    </section>
  );
};
