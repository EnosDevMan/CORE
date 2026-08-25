import React, { useState } from 'react';
import { UserRound } from 'lucide-react';
import type { Professional } from '../../professionals/types';
import { useNiche } from '../../../core/business/hooks';

export const ProfessionalsSection: React.FC<{ activeProfessionals: Professional[]; onSelectProfessional: (id: string) => void }> = ({ activeProfessionals, onSelectProfessional }) => {
  const niche = useNiche();
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  if (!activeProfessionals.length) return null;
  return <section id="professionals-section" className="core-public-page px-4 py-14 sm:py-16 lg:py-20"><div className="mx-auto max-w-6xl">
    <p className="core-public-primary-text text-xs font-bold uppercase tracking-[.16em]">Equipe</p><h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{niche.landing.professionalsTitle}</h2>
    <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{activeProfessionals.map(professional => <article key={professional.id} className="core-public-elevated core-public-border flex min-w-0 flex-col border p-4">
      <div className="flex min-w-0 items-center gap-4">{professional.avatar && !failed[professional.id] ? <img src={professional.avatar} alt={`Foto de ${professional.name}`} width="72" height="72" loading="lazy" onError={() => setFailed(v => ({ ...v, [professional.id]: true }))} className="size-[72px] shrink-0 rounded-full object-cover"/> : <div className="core-public-muted grid size-[72px] shrink-0 place-items-center rounded-full" aria-hidden="true"><UserRound size={30}/></div>}
      <div className="min-w-0"><h3 className="break-words text-lg font-extrabold">{professional.name}</h3><p className="core-public-primary-text mt-1 break-words text-sm font-semibold">{professional.specialty}</p></div></div>
      {professional.description && <p className="core-public-muted-text mt-4 line-clamp-3 text-sm leading-6">{professional.description}</p>}
      <button onClick={() => onSelectProfessional(professional.id)} className="core-public-ring core-public-primary-text mt-4 flex min-h-12 w-full items-center justify-center gap-2 border border-[var(--core-primary)] px-3 py-3 text-sm font-bold transition-opacity hover:opacity-75"><UserRound size={16}/>Agendar com {professional.name}</button>
    </article>)}</div>
  </div></section>;
};
