import React from 'react';
import { ArrowRight, Check, LogIn } from 'lucide-react';
import { BusinessConfig } from '../../../types';
import { useNiche } from '../../../core/business/hooks';
import { BusinessBrand } from '../../../core/business/BusinessBrand';
import type { HeroVariant } from '../../../layouts/types';
import { getHeroArtDirection } from '../artDirection';
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
}) => {
  const niche = useNiche();
  const art = getHeroArtDirection(variant);
  const confirmationCopy = config.bookingFee > 0
    ? 'Reserva com confirmação por PIX'
    : 'Confirmação imediata';

  return (
    <section className="core-hero" data-hero-variant={variant} style={art.section}>
      <div className="core-hero__inner" style={art.inner}>
        <div className="core-hero__copy" style={art.copy}>
          <BusinessBrand size="sm" className="core-hero__brand" style={art.brand} />
          <p className="core-hero__eyebrow" style={art.eyebrow}>
            <span /> {niche.landing.eyebrow}
          </p>
          <h1 className="core-hero__title" style={art.title}>{config.heroTitle || niche.landing.heroTitle}</h1>
          {config.heroSubtitle && <p className="core-hero__subtitle">{config.heroSubtitle}</p>}
          <p className="core-hero__description" style={art.description}>{config.heroDescription || niche.landing.heroDescription}</p>
          <div className="core-hero__actions" style={art.actions}>
            <button type="button" id="hero-book-now-btn" onClick={onStartBooking} className="core-hero__primary core-public-ring">
              Agendar agora <ArrowRight size={18} aria-hidden="true" />
            </button>
            <button type="button" onClick={onOpenLogin} className="core-hero__login core-public-ring"><LogIn size={17} /> Entrar</button>
          </div>
          <div className="core-hero__assurances" style={art.assurances} aria-label="Vantagens do agendamento">
            <span><Check size={14} /> Horários em tempo real</span>
            <span><Check size={14} /> {confirmationCopy}</span>
          </div>
        </div>
        <NicheHeroVisual nicheId={niche.id} imageUrl={imageUrl} variant={variant} />
      </div>
    </section>
  );
};
