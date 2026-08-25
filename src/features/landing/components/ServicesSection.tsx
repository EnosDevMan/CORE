import React, { useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import { Service } from '../../../types';
import { formatBRL } from '../../../utils/validation';
import { useNiche } from '../../../core/business/hooks';
import type { SectionStyle } from '../../../layouts/types';

interface Props { categories: string[]; activeServices: Service[]; onSelectService: (id: string) => void; style: SectionStyle; }

const cardStyle: Record<SectionStyle, string> = {
  structured: '',
  editorial: 'rounded-[var(--core-radius)] shadow-[var(--core-shadow)]',
  showcase: 'rounded-[calc(var(--core-radius)*1.35)] shadow-[var(--core-shadow)]',
  friendly: 'rounded-[calc(var(--core-radius)*1.7)] shadow-[var(--core-shadow)]',
};

export const ServicesSection: React.FC<Props> = ({ categories, activeServices, onSelectService, style }) => {
  const niche = useNiche();
  const [category, setCategory] = useState('Todos');
  const rail = useRef<HTMLDivElement>(null);
  const filtered = useMemo(() => category === 'Todos' ? activeServices : activeServices.filter(s => s.category === category), [activeServices, category]);
  const move = (direction: number) => rail.current?.scrollBy({ left: direction * rail.current.clientWidth * .85, behavior: 'smooth' });
  return <section id="services-section" className="core-public-page px-4 py-14 sm:py-16 lg:py-20" data-section-style={style}>
    <div className="mx-auto max-w-6xl">
      <div className={`flex gap-4 ${style === 'editorial' ? 'items-center justify-center text-center' : 'items-end justify-between'}`}>
        <div><p className="core-public-primary-text text-xs font-bold uppercase tracking-[.16em]">Serviços</p><h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{niche.landing.servicesTitle}</h2></div>
        <div className={`hidden gap-2 lg:flex ${style === 'editorial' ? 'absolute right-4' : ''}`}>
          <button aria-label="Serviços anteriores" onClick={() => move(-1)} className="core-public-border core-public-ring grid size-11 place-items-center border hover:opacity-75"><ArrowLeft size={19}/></button>
          <button aria-label="Próximos serviços" onClick={() => move(1)} className="core-public-border core-public-ring grid size-11 place-items-center border hover:opacity-75"><ArrowRight size={19}/></button>
        </div>
      </div>
      <div role="tablist" aria-label="Categorias de serviços" className={`no-scrollbar -mx-4 mt-7 flex overflow-x-auto px-4 pb-2 whitespace-nowrap ${style === 'editorial' ? 'sm:justify-center' : ''}`}>
        {['Todos', ...categories].map(item => <button key={item} role="tab" aria-selected={category === item} onClick={() => setCategory(item)} className={`core-public-ring min-h-11 shrink-0 border-b-2 px-4 text-sm font-bold ${category === item ? 'border-[var(--core-primary)] core-public-primary-text' : 'core-public-border core-public-muted-text'}`}>{item}</button>)}
      </div>
      <div ref={rail} className="services-rail -mx-4 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3" aria-live="polite">
        {filtered.map(service => <article key={service.id} className={`service-card core-public-elevated core-public-border flex shrink-0 snap-start flex-col border p-5 ${cardStyle[style]}`}>
          <span className="core-public-primary-text text-xs font-bold uppercase tracking-wider">{service.category}</span>
          <h3 className="mt-2 break-words text-xl font-extrabold">{service.name}</h3>
          <p className="core-public-muted-text mt-3 line-clamp-3 min-h-[4.5rem] text-sm leading-6">{service.description || 'Serviço realizado com atenção aos detalhes.'}</p>
          <div className="core-public-border mt-5 flex items-center justify-between gap-3 border-t pt-4"><span className="core-public-muted-text flex items-center gap-1.5 text-sm"><Clock size={16}/>{service.duration} min</span><strong className="break-words text-lg">{formatBRL(service.price)}</strong></div>
          <button onClick={() => onSelectService(service.id)} className="core-public-primary core-public-ring mt-5 min-h-12 w-full rounded-[var(--core-radius)] px-4 py-3 text-sm font-bold transition-opacity hover:opacity-90">Escolher serviço</button>
        </article>)}
      </div>
      <a href="#services-section" onClick={() => setCategory('Todos')} className="core-public-primary-text core-public-ring mt-4 inline-flex min-h-11 items-center text-sm font-bold underline decoration-current decoration-2 underline-offset-4">Ver todos os serviços</a>
    </div>
  </section>;
};
