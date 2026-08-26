import { useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Clock3 } from 'lucide-react';
import type { Service } from '../../../types';
import { formatBRL } from '../../../utils/validation';
import { useNiche } from '../../../core/business/hooks';
import type { SectionStyle } from '../../../layouts/types';

interface Props {
  categories: string[];
  activeServices: Service[];
  onSelectService: (id: string) => void;
  style: SectionStyle;
}

export function ServicesSection({ categories, activeServices, onSelectService, style }: Props) {
  const niche = useNiche();
  const [category, setCategory] = useState('Todos');
  const rail = useRef<HTMLDivElement>(null);
  const filtered = useMemo(
    () => category === 'Todos' ? activeServices : activeServices.filter(service => service.category === category),
    [activeServices, category],
  );
  const move = (direction: number) => rail.current?.scrollBy({
    left: direction * rail.current.clientWidth * .85,
    behavior: 'smooth',
  });

  return (
    <section id="services-section" className="core-section core-services-section" data-section-style={style}>
      <div className="core-section__inner">
        <div className="core-section-heading">
          <div>
            <p className="core-section-kicker">Serviços selecionados</p>
            <h2>{niche.landing.servicesTitle}</h2>
            <p className="core-section-intro">Escolha com calma. Duração, valor e disponibilidade aparecem antes da confirmação.</p>
          </div>
          <div className="core-section-controls" aria-label="Navegar pelos serviços">
            <button type="button" aria-label="Serviços anteriores" onClick={() => move(-1)} className="core-icon-button core-public-ring"><ArrowLeft size={19} /></button>
            <button type="button" aria-label="Próximos serviços" onClick={() => move(1)} className="core-icon-button core-public-ring"><ArrowRight size={19} /></button>
          </div>
        </div>

        <div role="tablist" aria-label="Categorias de serviços" className="core-category-tabs no-scrollbar">
          {['Todos', ...categories].map(item => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={category === item}
              onClick={() => setCategory(item)}
              className="core-public-ring"
            >
              {item}
            </button>
          ))}
        </div>

        <div ref={rail} className="services-rail core-service-rail" aria-live="polite">
          {filtered.map((service, index) => (
            <article key={service.id} className="service-card core-service-card">
              <div className="core-service-card__topline">
                <span className="core-service-card__number">{String(index + 1).padStart(2, '0')}</span>
                <span className="core-service-card__category">{service.category || 'Serviço'}</span>
              </div>
              <h3>{service.name}</h3>
              <p className="core-service-card__description">{service.description || 'Atendimento realizado com técnica, cuidado e atenção aos detalhes.'}</p>
              <div className="core-service-card__meta">
                <span><Clock3 size={16} /> {service.duration} min</span>
                <strong>{formatBRL(service.price)}</strong>
              </div>
              <button type="button" onClick={() => onSelectService(service.id)} className="core-service-card__action core-public-ring">
                Escolher <ArrowRight size={17} />
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
