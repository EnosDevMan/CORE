import { CalendarCheck2, Clock3, MapPin, ShieldCheck, WalletCards } from 'lucide-react';
import type { BusinessConfig } from '../../../types';
import { summarizeWeeklySchedule } from '../../../utils/validation';

export function FeaturesSection({ config }: { config: BusinessConfig }) {
  const schedule = summarizeWeeklySchedule(config.workingHours).find(item => item.value !== 'Fechado');
  const items = [
    config.address ? { icon: MapPin, label: 'Onde estamos', value: config.address } : null,
    schedule ? { icon: Clock3, label: 'Atendimento', value: `${schedule.label}, ${schedule.value}` } : null,
    { icon: WalletCards, label: 'Reserva', value: config.bookingFee > 0 ? `Confirmação por PIX · ${config.bookingFee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : 'Sem taxa de reserva' },
    { icon: CalendarCheck2, label: 'Disponibilidade', value: 'Horários atualizados online' },
  ].filter(Boolean) as Array<{ icon: typeof MapPin; label: string; value: string }>;

  return (
    <section aria-label="Informações do estabelecimento" className="core-trust-strip">
      <div className="core-trust-strip__inner">
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label} className="core-trust-item">
            <span className="core-trust-item__icon"><Icon size={19} /></span>
            <span><small>{label}</small><strong>{value}</strong></span>
          </div>
        ))}
        <div className="core-trust-item core-trust-item--secure">
          <span className="core-trust-item__icon"><ShieldCheck size={19} /></span>
          <span><small>Agendamento seguro</small><strong>Seus dados protegidos</strong></span>
        </div>
      </div>
    </section>
  );
}
