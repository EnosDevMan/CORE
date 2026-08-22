import React from 'react';
import { Clock, MapPin, WalletCards } from 'lucide-react';
import { BarbershopConfig } from '../../../types';
import { summarizeWeeklySchedule } from '../../../utils/validation';

export const FeaturesSection: React.FC<{ config: BarbershopConfig }> = ({ config }) => {
  const schedule = summarizeWeeklySchedule(config.workingHours).find(item => item.value !== 'Fechado');
  return <section aria-label="Informações da barbearia" className="border-b border-white/10 bg-brand-navy-soft px-4 py-6">
    <div className="mx-auto grid max-w-6xl gap-4 text-sm leading-6 text-slate-200 sm:grid-cols-3 sm:gap-6">
      {config.address && <div className="flex items-start gap-3"><MapPin className="mt-0.5 shrink-0 text-brand-copper" size={19}/><span>{config.address}</span></div>}
      {schedule && <div className="flex items-start gap-3"><Clock className="mt-0.5 shrink-0 text-brand-copper" size={19}/><span>{schedule.label}: {schedule.value}</span></div>}
      <div className="flex items-start gap-3"><WalletCards className="mt-0.5 shrink-0 text-brand-copper" size={19}/><span>{config.bookingFee > 0 ? `Confirmação por PIX: ${config.bookingFee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : 'Sem taxa de reserva'}</span></div>
    </div>
  </section>;
};
