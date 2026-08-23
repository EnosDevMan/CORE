import React, { useState } from 'react';
import { UserRound } from 'lucide-react';
import type { Professional } from '../../professionals/types';

export const ProfessionalsSection: React.FC<{ activeProfessionals: Professional[]; onSelectProfessional: (id: string) => void }> = ({ activeProfessionals, onSelectProfessional }) => {
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  if (!activeProfessionals.length) return null;
  return <section id="professionals-section" className="bg-brand-cream px-4 py-14 sm:py-16 lg:py-20"><div className="mx-auto max-w-6xl">
    <p className="text-xs font-bold uppercase tracking-[.16em] text-brand-copper">Equipe</p><h2 className="mt-2 text-3xl font-black tracking-tight text-brand-navy sm:text-4xl">Conheça nossos profissionais</h2>
    <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{activeProfessionals.map(professional => <article key={professional.id} className="flex min-w-0 flex-col border border-slate-200 bg-white p-4">
      <div className="flex min-w-0 items-center gap-4">{professional.avatar && !failed[professional.id] ? <img src={professional.avatar} alt={`Foto de ${professional.name}`} width="72" height="72" loading="lazy" onError={() => setFailed(v => ({ ...v, [professional.id]: true }))} className="size-[72px] shrink-0 rounded-full object-cover"/> : <div className="grid size-[72px] shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500" aria-hidden="true"><UserRound size={30}/></div>}
      <div className="min-w-0"><h3 className="break-words text-lg font-extrabold text-brand-navy">{professional.name}</h3><p className="mt-1 break-words text-sm font-semibold text-brand-copper">{professional.specialty}</p></div></div>
      {professional.description && <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{professional.description}</p>}
      <button onClick={() => onSelectProfessional(professional.id)} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 border border-brand-navy px-3 py-3 text-sm font-bold text-brand-navy hover:bg-brand-navy hover:text-white"><UserRound size={16}/>Agendar com {professional.name}</button>
    </article>)}</div>
  </div></section>;
};
