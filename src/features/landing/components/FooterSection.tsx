import React from 'react';
import { Scissors, Instagram, Facebook, MapPin, Phone, WalletCards } from 'lucide-react';
import { Professional, BusinessConfig, ScheduleBlock } from '../../../types';
import { getBusinessTodayStr, summarizeWeeklySchedule } from '../../../utils/validation';
import { useBusiness } from '../../../core/business/hooks';

interface FooterSectionProps {
  config: BusinessConfig;
  professionals: Professional[];
  scheduleBlocks: ScheduleBlock[];
  onOpenPrivacy: () => void;
}

export const FooterSection: React.FC<FooterSectionProps> = ({ config, professionals, scheduleBlocks, onOpenPrivacy }) => {
  const { profile } = useBusiness();
  const today = getBusinessTodayStr(profile.timezone);
  const activeProfessionalIds = new Set(professionals.map(professional => professional.id));
  const specialOpenings = scheduleBlocks
    .filter(block => block.type === 'special' && block.specialHours && block.date && block.date >= today && (block.professionalId === 'all' || activeProfessionalIds.has(block.professionalId)))
    .sort((a, b) => a.date!.localeCompare(b.date!))
    .slice(0, 4);
  return (
    <footer className="bg-brand-navy text-slate-400 py-20 px-4 border-t border-white/10">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* Column 1 - Brand */}
        <div className="space-y-5">
          <h4 className="text-white font-extrabold text-xl tracking-wider uppercase flex items-center gap-2">
            <Scissors size={20} className="text-brand-copper" /> {config.name}
          </h4>
          <p className="text-xs md:text-sm leading-relaxed max-w-xs text-slate-400 font-light">
            {config.aboutText || profile.description || 'Atendimento profissional com qualidade e atenção aos detalhes.'}
          </p>
          {/* Social icons */}
          <div className="flex gap-3 pt-2">
            {config.socialLinks.instagram && (
              <a
                href={config.socialLinks.instagram}
                target="_blank"
                rel="noreferrer"
                className="p-3 bg-brand-navy-soft hover:bg-white/10 text-brand-copper hover:text-white rounded-xl transition-colors border border-white/10"
              >
                <Instagram size={18} />
              </a>
            )}
            {config.socialLinks.facebook && (
              <a
                href={config.socialLinks.facebook}
                target="_blank"
                rel="noreferrer"
                className="p-3 bg-brand-navy-soft hover:bg-white/10 text-brand-copper hover:text-white rounded-xl transition-colors border border-white/10"
              >
                <Facebook size={18} />
              </a>
            )}
          </div>
        </div>

        {/* Column 2 - Working hours */}
        <div className="space-y-5">
          <h4 className="text-white font-extrabold text-sm uppercase tracking-widest text-slate-200">Atendimento</h4>
          <ul className="space-y-3 text-xs md:text-sm">
            {summarizeWeeklySchedule(config.workingHours).map(({ label, value }) => (
              <li key={label} className={`flex justify-between border-b border-white/10 pb-2 ${value === 'Fechado' ? 'text-slate-500' : ''}`}>
                <span className="text-slate-400">{label}:</span>
                {value === 'Fechado' ? (
                  <span className="font-bold bg-brand-navy-soft px-2 py-0.5 rounded text-[10px] uppercase">Fechado</span>
                ) : (
                  <span className="text-slate-200 font-semibold">{value}</span>
                )}
              </li>
            ))}
          </ul>
          {specialOpenings.length > 0 && <div className="border-l-2 border-brand-copper pl-3">
            <p className="mb-2 text-[10px] font-extrabold uppercase tracking-widest text-brand-copper">Próximos horários especiais</p>
            <ul className="space-y-2 text-xs text-slate-300">
              {specialOpenings.map(block => {
                const professional = block.professionalId === 'all' ? 'Todos os profissionais' : professionals.find(item => item.id === block.professionalId)?.name;
                const date = new Date(`${block.date}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
                return <li key={block.id}><strong className="text-white">{date}</strong> · {block.specialHours!.open} - {block.specialHours!.close}{professional ? ` · ${professional}` : ''}</li>;
              })}
            </ul>
          </div>}
        </div>

        {/* Column 3 - Contact Info */}
        <div className="space-y-5">
          <h4 className="text-white font-extrabold text-sm uppercase tracking-widest text-slate-200">Localização e Contato</h4>
          <div className="space-y-4 text-xs md:text-sm">
            {config.address && (
              <p className="flex items-start gap-3">
                <MapPin size={18} className="text-brand-copper shrink-0 mt-0.5" />
                <span className="leading-relaxed">{config.address}</span>
              </p>
            )}
            <p className="flex items-center gap-3">
              <Phone size={18} className="text-brand-copper shrink-0" />
              <span>{config.phone}</span>
            </p>
            <p className="flex items-center gap-3">
              <WalletCards size={18} className="text-brand-copper shrink-0" />
              <span>{config.bookingFee > 0 ? `Taxa de reserva: ${config.bookingFee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : 'Sem taxa de reserva'}</span>
            </p>
          </div>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto mt-16 pt-8 border-t border-white/10 text-center text-xs text-slate-500 space-y-2">
        <button onClick={onOpenPrivacy} className="block mx-auto text-slate-400 hover:text-white underline underline-offset-2 transition-colors">
          Política de Privacidade
        </button>
        <div>&copy; {new Date().getFullYear()} {config.name}. Todos os direitos reservados.</div>
      </div>
    </footer>
  );
};
