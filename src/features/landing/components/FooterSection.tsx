import { ArrowUpRight, Facebook, Instagram, MapPin, Phone, WalletCards } from 'lucide-react';
import type { BusinessConfig, Professional, ScheduleBlock } from '../../../types';
import { BusinessBrand } from '../../../core/business/BusinessBrand';
import { getBusinessTodayStr, summarizeWeeklySchedule } from '../../../utils/validation';
import { useBusiness } from '../../../core/business/hooks';

interface FooterSectionProps {
  config: BusinessConfig;
  professionals: Professional[];
  scheduleBlocks: ScheduleBlock[];
  onOpenPrivacy: () => void;
}

export function FooterSection({ config, professionals, scheduleBlocks, onOpenPrivacy }: FooterSectionProps) {
  const { profile } = useBusiness();
  const today = getBusinessTodayStr(profile.timezone);
  const activeProfessionalIds = new Set(professionals.map(professional => professional.id));
  const specialOpenings = scheduleBlocks
    .filter(block => block.type === 'special' && block.specialHours && block.date && block.date >= today && (block.professionalId === 'all' || activeProfessionalIds.has(block.professionalId)))
    .sort((a, b) => a.date!.localeCompare(b.date!))
    .slice(0, 4);

  return (
    <footer className="core-footer">
      <div className="core-footer__glow" aria-hidden="true" />
      <div className="core-footer__inner">
        <div className="core-footer__brand">
          <BusinessBrand size="lg" />
          <p>{config.aboutText || profile.description || 'Atendimento profissional, organizado e feito com atenção aos detalhes.'}</p>
          <div className="core-footer__socials">
            {config.socialLinks.instagram && <a href={config.socialLinks.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="core-public-ring"><Instagram size={18} /></a>}
            {config.socialLinks.facebook && <a href={config.socialLinks.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="core-public-ring"><Facebook size={18} /></a>}
          </div>
        </div>

        <div className="core-footer__column">
          <h4>Atendimento</h4>
          <ul className="core-footer__schedule">
            {summarizeWeeklySchedule(config.workingHours).map(({ label, value }) => (
              <li key={label}><span>{label}</span><strong>{value}</strong></li>
            ))}
          </ul>
          {specialOpenings.length > 0 && (
            <div className="core-footer__special">
              <strong>Próximos horários especiais</strong>
              {specialOpenings.map(block => {
                const date = new Date(`${block.date}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
                return <span key={block.id}>{date} · {block.specialHours!.open}–{block.specialHours!.close}</span>;
              })}
            </div>
          )}
        </div>

        <div className="core-footer__column">
          <h4>Fale com a gente</h4>
          {config.address && <p><MapPin size={18} /><span>{config.address}</span></p>}
          {config.phone && <p><Phone size={18} /><span>{config.phone}</span></p>}
          <p><WalletCards size={18} /><span>{config.bookingFee > 0 ? 'Confirmação de reserva via PIX' : 'Agendamento sem taxa'}</span></p>
          <a href="#services-section" className="core-footer__cta core-public-ring">Conhecer serviços <ArrowUpRight size={17} /></a>
        </div>
      </div>
      <div className="core-footer__bottom">
        <span>© {new Date().getFullYear()} {profile.name}</span>
        <button type="button" onClick={onOpenPrivacy} className="core-public-ring">Política de Privacidade</button>
      </div>
    </footer>
  );
}
