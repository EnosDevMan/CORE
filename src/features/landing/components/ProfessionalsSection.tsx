import { useState } from 'react';
import { ArrowUpRight, UserRound } from 'lucide-react';
import type { Professional } from '../../professionals/types';
import { useNiche } from '../../../core/business/hooks';
import type { SectionStyle } from '../../../layouts/types';

interface Props {
  activeProfessionals: Professional[];
  onSelectProfessional: (id: string) => void;
  style: SectionStyle;
}

export function ProfessionalsSection({ activeProfessionals, onSelectProfessional, style }: Props) {
  const niche = useNiche();
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  if (!activeProfessionals.length) return null;

  return (
    <section id="professionals-section" className="core-section core-team-section" data-section-style={style}>
      <div className="core-section__inner">
        <div className="core-section-heading">
          <div>
            <p className="core-section-kicker">Pessoas que fazem acontecer</p>
            <h2>{niche.landing.professionalsTitle}</h2>
            <p className="core-section-intro">Veja especialidades e escolha quem combina com o atendimento que você procura.</p>
          </div>
        </div>
        <div className="core-team-grid">
          {activeProfessionals.map((professional, index) => (
            <article key={professional.id} className="core-professional-card">
              <div className="core-professional-card__portrait">
                {professional.avatar && !failed[professional.id] ? (
                  <img
                    src={professional.avatar}
                    alt={`Foto de ${professional.name}`}
                    width="560"
                    height="680"
                    loading="lazy"
                    onError={() => setFailed(current => ({ ...current, [professional.id]: true }))}
                  />
                ) : (
                  <div className="core-professional-card__fallback" aria-hidden="true"><UserRound size={52} /></div>
                )}
                <span className="core-professional-card__index">{String(index + 1).padStart(2, '0')}</span>
              </div>
              <div className="core-professional-card__content">
                <p>{professional.specialty || 'Atendimento profissional'}</p>
                <h3>{professional.name}</h3>
                {professional.description && <span>{professional.description}</span>}
                <button type="button" onClick={() => onSelectProfessional(professional.id)} className="core-public-ring">
                  Ver horários <ArrowUpRight size={17} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
