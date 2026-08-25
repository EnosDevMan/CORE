import React from 'react';
import { Instagram, Facebook, MapPin, Phone, WalletCards } from 'lucide-react';
import { Professional, BusinessConfig, ScheduleBlock } from '../../../types';
import { getBusinessTodayStr, summarizeWeeklySchedule } from '../../../utils/validation';
import { useBusiness, useNiche } from '../../../core/business/hooks';
import { NicheMark } from '../NicheMark';

interface FooterSectionProps {
  config: BusinessConfig;
  professionals: Professional[];
  scheduleBlocks: ScheduleBlock[];
  onOpenPrivacy: () => void;
}

export const FooterSection: React.FC<FooterSectionProps> = ({ config, professionals, scheduleBlocks, onOpenPrivacy }) => {
  const { profile } = useBusiness();
  const niche = useNiche();
  const today = getBusinessTodayStr(profile.timezone);
  const activeProfessionalIds = new Set(professionals.map(professional => professional.id));
  const specialOpenings = scheduleBlocks
    .filter(block => block.type === 'special' && block.specialHours && block.date && block.date >= today && (block.professionalId === 'all' || activeProfessionalIds.has(block.professionalId)))
    .sort((a, b) => a.date!.localeCompare(b.date!))
    .slice(0, 4);
  return (
    <footer className="core-public-surface core-public-border border-t px-4 py-20">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 md:grid-cols-3">
        <div className="space-y-5">
          <h4 className="flex items-center gap-2 text-xl font-extrabold tracking-wider uppercase">
            <NicheMark nicheId={niche.id} size={20} className="core-public-primary-text" aria-hidden="true" /> {config.name}
          </h4>
          <p className="core-public-muted-text max-w-xs text-xs font-light leading-relaxed md:text-sm">
            {config.aboutText || profile.description || 'Atendimento profissional com qualidade e atenção aos detalhes.'}
          </p>
          <div className="flex gap-3 pt-2">
            {config.socialLinks.instagram && (
              <a href={config.socialLinks.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="core-public-muted core-public-border core-public-ring rounded-xl border p-3 transition-opacity hover:opacity-75">
                <Instagram size={18} />
              </a>
            )}
            {config.socialLinks.facebook && (
              <a href={config.socialLinks.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="core-public-muted core-public-border core-public-ring rounded-xl border p-3 transition-opacity hover:opacity-75">
                <Facebook size={18} />
              </a>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <h4 className="text-sm font-extrabold tracking-widest uppercase">Atendimento</h4>
          <ul className="space-y-3 text-xs md:text-sm">
            {summarizeWeeklySchedule(config.workingHours).map(({ label, value }) => (
              <li key={label} className={`core-public-border flex justify-between border-b pb-2 ${value === 'Fechado' ? 'core-public-muted-text' : ''}`}>
                <span className="core-public-muted-text">{label}:</span>
                {value === 'Fechado' ? (
                  <span className="core-public-muted rounded px-2 py-0.5 text-[10px] font-bold uppercase">Fechado</span>
                ) : (
                  <span className="font-semibold">{value}</span>
                )}
              </li>
            ))}
          </ul>
          {specialOpenings.length > 0 && <div className="border-l-2 border-[var(--core-primary)] pl-3">
            <p className="core-public-primary-text mb-2 text-[10px] font-extrabold tracking-widest uppercase">Próximos horários especiais</p>
            <ul className="core-public-muted-text space-y-2 text-xs">
              {specialOpenings.map(block => {
                const professional = block.professionalId === 'all' ? 'Todos os profissionais' : professionals.find(item => item.id === block.professionalId)?.name;
                const date = new Date(`${block.date}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
                return <li key={block.id}><strong className="text-[var(--core-foreground)]">{date}</strong> · {block.specialHours!.open} - {block.specialHours!.close}{professional ? ` · ${professional}` : ''}</li>;
              })}
            </ul>
          </div>}
        </div>

        <div className="space-y-5">
          <h4 className="text-sm font-extrabold tracking-widest uppercase">Localização e Contato</h4>
          <div className="core-public-muted-text space-y-4 text-xs md:text-sm">
            {config.address && <p className="flex items-start gap-3"><MapPin size={18} className="core-public-primary-text mt-0.5 shrink-0" /><span className="leading-relaxed">{config.address}</span></p>}
            {config.phone && <p className="flex items-center gap-3"><Phone size={18} className="core-public-primary-text shrink-0" /><span>{config.phone}</span></p>}
            <p className="flex items-center gap-3"><WalletCards size={18} className="core-public-primary-text shrink-0" /><span>{config.bookingFee > 0 ? `Taxa de reserva: ${config.bookingFee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : 'Sem taxa de reserva'}</span></p>
          </div>
        </div>
      </div>

      <div className="core-public-border core-public-muted-text mx-auto mt-16 max-w-6xl space-y-2 border-t pt-8 text-center text-xs">
        <button onClick={onOpenPrivacy} className="core-public-ring underline underline-offset-2 transition-opacity hover:opacity-75">Política de Privacidade</button>
        <div>&copy; {new Date().getFullYear()} {config.name}. Todos os direitos reservados.</div>
      </div>
    </footer>
  );
};
