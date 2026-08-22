import React, { useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import { Service } from '../../../types';
import { formatBRL } from '../../../utils/validation';

interface Props { categories: string[]; activeServices: Service[]; onSelectService: (id: string) => void; }
export const ServicesSection: React.FC<Props> = ({ categories, activeServices, onSelectService }) => {
  const [category, setCategory] = useState('Todos');
  const rail = useRef<HTMLDivElement>(null);
  const filtered = useMemo(() => category === 'Todos' ? activeServices : activeServices.filter(s => s.category === category), [activeServices, category]);
  const move = (direction: number) => rail.current?.scrollBy({ left: direction * rail.current.clientWidth * .85, behavior: 'smooth' });
  return <section id="services-section" className="bg-brand-cream px-4 py-14 sm:py-16 lg:py-20">
    <div className="mx-auto max-w-6xl">
      <div className="flex items-end justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[.16em] text-brand-copper">Serviços</p><h2 className="mt-2 text-3xl font-black tracking-tight text-brand-navy sm:text-4xl">Escolha seu cuidado</h2></div>
        <div className="hidden gap-2 lg:flex">
          <button aria-label="Serviços anteriores" onClick={() => move(-1)} className="grid size-11 place-items-center border border-slate-300 text-slate-700 hover:bg-slate-50"><ArrowLeft size={19}/></button>
          <button aria-label="Próximos serviços" onClick={() => move(1)} className="grid size-11 place-items-center border border-slate-300 text-slate-700 hover:bg-slate-50"><ArrowRight size={19}/></button>
        </div>
      </div>
      <div role="tablist" aria-label="Categorias de serviços" className="no-scrollbar -mx-4 mt-7 flex overflow-x-auto px-4 pb-2 whitespace-nowrap">
        {['Todos', ...categories].map(item => <button key={item} role="tab" aria-selected={category === item} onClick={() => setCategory(item)} className={`min-h-11 shrink-0 border-b-2 px-4 text-sm font-bold ${category === item ? 'border-brand-copper text-brand-navy' : 'border-slate-200 text-slate-500'}`}>{item}</button>)}
      </div>
      <div ref={rail} className="services-rail -mx-4 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3" aria-live="polite">
        {filtered.map(service => <article key={service.id} className="service-card flex shrink-0 snap-start flex-col border border-slate-200 bg-white p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-copper">{service.category}</span>
          <h3 className="mt-2 break-words text-xl font-extrabold text-brand-navy">{service.name}</h3>
          <p className="mt-3 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-slate-600">{service.description || 'Serviço realizado com atenção aos detalhes.'}</p>
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-200 pt-4"><span className="flex items-center gap-1.5 text-sm text-slate-600"><Clock size={16}/>{service.duration} min</span><strong className="break-words text-lg text-brand-navy">{formatBRL(service.price)}</strong></div>
          <button onClick={() => onSelectService(service.id)} className="mt-5 min-h-12 w-full bg-brand-navy px-4 py-3 text-sm font-bold text-white hover:bg-brand-navy-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy">Escolher serviço</button>
        </article>)}
      </div>
      <a href="#services-section" onClick={() => setCategory('Todos')} className="mt-4 inline-flex min-h-11 items-center text-sm font-bold text-brand-navy underline decoration-brand-copper decoration-2 underline-offset-4">Ver todos os serviços</a>
    </div>
  </section>;
};
