import React from 'react';
import { Clock, MapPin, WalletCards } from 'lucide-react';
import { BusinessConfig } from '../../../types';
import { summarizeWeeklySchedule } from '../../../utils/validation';

export const FeaturesSection: React.FC<{ config: BusinessConfig }> = ({ config }) => {
  const schedule = summarizeWeeklySchedule(config.workingHours).find(item => item.value !== 'Fechado');
  return <section aria-label="Informações do estabelecimento" className="core-public-secondary core-public-border border-b px-4 py-6">
    <div className="mx-auto grid max-w-6xl gap-4 text-sm leading-6 sm:grid-cols-3 sm:gap-6">
      {config.address && <div className="flex items-start gap-3"><MapPin className="core-public-primary-text mt-0.5 shrink-0" size={19}/><span>{config.address}</span></div>}
      {schedule && <div className="flex items-start gap-3"><Clock className="core-public-primary-text mt-0.5 shrink-0" size={19}/><span>{schedule.label}: {schedule.value}</span></div>}
      <div className="flex items-start gap-3"><WalletCards className="core-public-primary-text mt-0.5 shrink-0" size={19}/><span>{config.bookingFee > 0 ? `Confirmação por PIX: ${config.bookingFee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : 'Sem taxa de reserva'}</span></div>
    </div>
  </section>;
};
