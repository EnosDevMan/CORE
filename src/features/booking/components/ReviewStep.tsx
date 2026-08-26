import React from 'react';
import { BusinessConfig, User, Service } from '../../../types';
import type { Professional } from '../../professionals/types';
import { User as UserIcon, Phone, FileText } from 'lucide-react';
import { formatBRL } from '../../../utils/validation';

interface Props {
  currentUser: User | null;
  custName: string;
  setCustName: (name: string) => void;
  custPhone: string;
  setCustPhone: (phone: string) => void;
  notes: string;
  setNotes: (notes: string) => void;
  selectedProfessional: Professional | null;
  selectedServices: Service[];
  selectedDate: string;
  selectedTime: string;
  totalDuration: number;
  totalPrice: number;
  config: BusinessConfig;
}

const formatNotice = (minutes: number): string => {
  if (minutes % 1440 === 0) return `${minutes / 1440} ${minutes === 1440 ? 'dia' : 'dias'}`;
  if (minutes % 60 === 0) return `${minutes / 60} ${minutes === 60 ? 'hora' : 'horas'}`;
  return `${minutes} minutos`;
};

export const ReviewStep: React.FC<Props> = ({
  currentUser,
  custName, setCustName,
  custPhone, setCustPhone,
  notes, setNotes,
  selectedProfessional,
  selectedServices,
  selectedDate,
  selectedTime,
  totalDuration,
  totalPrice,
  config,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
        <h4 className="font-bold text-sm text-slate-800 mb-4 uppercase tracking-wider">Resumo do Agendamento</h4>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center pb-3 border-b border-slate-200/60">
            <span className="text-slate-500">Profissional</span>
            <span className="font-bold text-slate-800">{selectedProfessional?.name}</span>
          </div>

          <div className="flex justify-between items-start pb-3 border-b border-slate-200/60">
            <span className="text-slate-500 mt-0.5">Serviços</span>
            <div className="text-right">
              {selectedServices.map(s => (
                <div key={s.id} className="font-bold text-slate-800">{s.name}</div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center pb-3 border-b border-slate-200/60">
            <span className="text-slate-500">Data e Hora</span>
            <span className="font-bold text-slate-800">
              {selectedDate.split('-').reverse().join('/')} às {selectedTime}
            </span>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-slate-500">Valor dos serviços</span>
            <div className="text-right">
              <div className="font-bold text-lg text-indigo-600">{totalPrice === 0 ? 'Grátis' : formatBRL(totalPrice)}</div>
              <div className="text-xs text-slate-400">Duração: ~{totalDuration} min</div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        {config.bookingFee > 0 ? (
          <p>
            <strong>Taxa de reserva: {formatBRL(config.bookingFee)}.</strong>{' '}
            Ela é cobrada separadamente via PIX para confirmar o horário e não é reembolsável em caso de cancelamento.
          </p>
        ) : (
          <p><strong>Sem taxa de reserva.</strong> O horário será confirmado ao concluir esta etapa.</p>
        )}
        <p className="mt-2 text-xs leading-relaxed text-amber-900">
          {(config.cancellationNoticeMinutes ?? 0) > 0
            ? `Cancelamentos online exigem pelo menos ${formatNotice(config.cancellationNoticeMinutes ?? 0)} de antecedência.`
            : 'Cancelamentos online são permitidos até o início do horário reservado.'}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-amber-900">
          Ao confirmar, você solicita a reserva e reconhece os{' '}
          <a
            href="#privacy"
            target="_blank"
            rel="noreferrer"
            className="font-bold underline underline-offset-2"
          >
            Termos de Uso e a Política de Privacidade
          </a>.
        </p>
      </div>

      <div className="space-y-4">
        <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Seus Dados</h4>

        {currentUser ? (
          <div className="space-y-3">
            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                <UserIcon size={20} />
              </div>
              <div>
                <p className="font-bold text-indigo-950 text-sm">{currentUser.name}</p>
                <p className="text-xs text-indigo-600/70">{currentUser.email}</p>
              </div>
            </div>
            {!currentUser.phone && (
              <label className="block">
                <span className="sr-only">WhatsApp com DDD</span>
                <div className="relative">
                  <input
                    type="tel"
                    maxLength={32}
                    inputMode="tel"
                    autoComplete="tel"
                    aria-label="WhatsApp com DDD"
                    placeholder="Informe seu WhatsApp com DDD"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-base"
                  />
                  <Phone size={16} className="absolute left-3.5 top-3 text-slate-400" />
                </div>
              </label>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                aria-label="Nome completo"
                autoComplete="name"
                minLength={2}
                maxLength={100}
                placeholder="Seu nome completo"
                value={custName}
                onChange={(e) => setCustName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-base"
              />
              <UserIcon size={16} className="absolute left-3.5 top-3 text-slate-400" />
            </div>

            <div className="relative">
              <input type="tel" inputMode="tel" autoComplete="tel" maxLength={32} aria-label="WhatsApp com DDD" placeholder="Seu WhatsApp com DDD" value={custPhone} onChange={(e) => setCustPhone(e.target.value)} className="w-full min-h-12 pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-base" />
              <Phone size={16} className="absolute left-3.5 top-4 text-slate-400" />
            </div>
          </div>
        )}

        <div className="relative">
          <textarea
            aria-label="Observações para o profissional"
            placeholder="Alguma observação para o profissional? (Opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={1000}
            rows={2}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm resize-none"
          />
          <FileText size={16} className="absolute left-3.5 top-3 text-slate-400" />
        </div>
      </div>
    </div>
  );
};
