import React from 'react';
import { ArrowRight, Check, LogIn } from 'lucide-react';
import { BusinessConfig } from '../../../types';
import { useNiche } from '../../../core/business/hooks';
import { BusinessBrand } from '../../../core/business/BusinessBrand';
import type { HeroVariant } from '../../../layouts/types';
import { NicheHeroVisual } from './NicheHeroVisual';

interface HeroSectionProps {
  config: BusinessConfig;
  onStartBooking: () => void;
  onOpenLogin: () => void;
  variant: HeroVariant;
  imageUrl?: string;
  serviceCount: number;
  professionalCount: number;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  config,
  onStartBooking,
  onOpenLogin,
  variant,
  imageUrl,
  serviceCount,
  professionalCount,
}) => {
  const niche = useNiche();
  return (
    <section className="core-hero" data-hero-variant={variant}>
      <div className="core-hero__inner">
        <div className="core-hero__copy">
          <BusinessBrand size="sm" className="core-hero__brand" />
          <p className="core-hero__eyebrow">
            <span /> {niche.landing.eyebrow}
          </p>
          <h1 className="core-hero__title">{config.heroTitle || niche.landing.heroTitle}</h1>
          {config.heroSubtitle && <p className="core-hero__subtitle">{config.heroSubtitle}</p>}
          <p className="core-hero__description">{config.heroDescription || niche.landing.heroDescription}</p>
          <div className="core-hero__actions">
            <button type="button" id="hero-book-now-btn" onClick={onStartBooking} className="core-hero__primary core-public-ring">
              Agendar agora <ArrowRight size={18} aria-hidden="true" />
            </button>
            <button type="button" onClick={onOpenLogin} className="core-hero__login core-public-ring"><LogIn size={17} /> Entrar</button>
          </div>
          <div className="core-hero__assurances" aria-label="Vantagens do agendamento">
            <span><Check size={14} /> Horários em tempo real</span>
            <span><Check size={14} /> Confirmação imediata</span>
          </div>
        </div>
        <NicheHeroVisual nicheId={niche.id} imageUrl={imageUrl} serviceCount={serviceCount} professionalCount={professionalCount} />
      </div>
    </section>
  );
};
