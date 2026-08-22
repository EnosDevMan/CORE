import React from 'react';
import { ArrowRight, Scissors } from 'lucide-react';
import { BarbershopConfig } from '../../../types';

interface HeroSectionProps { config: BarbershopConfig; onStartBooking: () => void; onOpenLogin: () => void; }

export const HeroSection: React.FC<HeroSectionProps> = ({ config, onStartBooking, onOpenLogin }) => (
  <section className="bg-brand-navy text-white px-4 py-14 sm:py-16 lg:py-24">
    <div className="mx-auto max-w-6xl lg:grid lg:grid-cols-[1fr_280px] lg:items-end lg:gap-16">
      <div className="max-w-3xl">
        <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-copper">
          <Scissors size={16} aria-hidden="true" /> Agendamento online
        </p>
        <h1 className="max-w-2xl text-4xl font-black leading-[1.04] tracking-[-0.04em] sm:text-5xl lg:text-7xl">
          {config.heroTitle || 'Seu corte, no seu horário.'}
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
          {config.heroDescription || 'Cabelo e barba com atendimento próximo, cuidado nos detalhes e horário marcado.'}
        </p>
      </div>
      <div className="mt-8 flex w-full flex-col gap-3 lg:mt-0">
        <button id="hero-book-now-btn" onClick={onStartBooking} className="flex min-h-12 w-full items-center justify-center gap-2 bg-brand-copper px-6 py-3 font-bold text-brand-navy transition-colors hover:bg-brand-copper-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
          Ver horários <ArrowRight size={18} aria-hidden="true" />
        </button>
        <button onClick={onOpenLogin} className="min-h-12 w-full border border-slate-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Entrar</button>
      </div>
    </div>
  </section>
);
