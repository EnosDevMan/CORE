import React, { useEffect, useRef } from 'react';
import { Booking, BusinessConfig } from '../../../types';
import { CheckCircle2, Calendar as CalendarIcon, Clock, Copy, ArrowRight, MessageCircle } from 'lucide-react';
import { buildBookingWhatsAppLink } from '../../../utils/whatsapp';

interface Props {
  booking: Booking;
  config: BusinessConfig;
  copiedPix: boolean;
  copyPix: () => void;
  onNavigateToView: (view: 'home' | 'admin' | 'customer', id?: string) => void;
  professionalName?: string;
  serviceNames?: string;
}

export const SuccessStep: React.FC<Props> = ({
  booking,
  config,
  copiedPix,
  copyPix,
  onNavigateToView,
  professionalName,
  serviceNames,
}) => {
  const whatsappLink = buildBookingWhatsAppLink({ booking, config, professionalName, serviceNames });
  const awaitingPayment = booking.status === 'Aguardando pagamento';
  const attemptedWhatsApp = useRef(false);

  useEffect(() => {
    if (!whatsappLink || attemptedWhatsApp.current) return;
    attemptedWhatsApp.current = true;
    // Browsers may block this because persistence finishes asynchronously;
    // the visible link below is the reliable fallback in that case.
    window.open(whatsappLink, '_blank', 'noopener,noreferrer');
  }, [whatsappLink]);

  return (
    <div className="text-center space-y-6 py-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2 relative">
        <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20"></div>
        <CheckCircle2 size={40} />
      </div>

      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          {awaitingPayment ? 'Agendamento recebido!' : 'Agendamento confirmado!'}
        </h2>
        <p className="text-slate-500 mt-2">
          {awaitingPayment ? 'Conclua o pagamento para garantir o horário de ' : 'Te esperamos no dia '}
          <strong className="text-slate-800">{booking.date.split('-').reverse().join('/')}</strong>
        </p>
      </div>

      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 max-w-sm mx-auto flex items-center justify-center gap-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5 text-slate-400 mb-1">
            <CalendarIcon size={14} />
            <span className="text-xs font-medium uppercase tracking-wider">Data</span>
          </div>
          <div className="font-bold text-slate-800">{booking.date.split('-').reverse().join('/')}</div>
        </div>
        <div className="w-px h-10 bg-slate-200"></div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5 text-slate-400 mb-1">
            <Clock size={14} />
            <span className="text-xs font-medium uppercase tracking-wider">Horário</span>
          </div>
          <div className="font-bold text-slate-800">{booking.time}</div>
        </div>
      </div>

      {awaitingPayment && config.pixKey && (
        <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100/50 max-w-sm mx-auto text-left">
          <h4 className="font-bold text-indigo-950 text-sm mb-2 flex items-center gap-2">
            Pague via PIX
          </h4>
          <p className="text-xs text-indigo-900/60 mb-3">
            Garante seu horário adiantando o pagamento.
          </p>
          <div className="flex items-center gap-2">
            <div className="bg-white border border-indigo-100 px-3 py-2 rounded-lg text-xs font-mono text-slate-600 flex-1 truncate">
              {config.pixKey}
            </div>
            <button
              type="button"
              onClick={copyPix}
              aria-label={copiedPix ? 'Chave PIX copiada' : 'Copiar chave PIX'}
              className={`p-2 rounded-lg transition-colors ${
                copiedPix ? 'bg-emerald-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {copiedPix ? <CheckCircle2 size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      )}

      <div className="pt-2 max-w-sm mx-auto space-y-3">
        {whatsappLink && (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 px-6 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20"
          >
            <MessageCircle size={18} />
            Notificar no WhatsApp
          </a>
        )}

        <button
          onClick={() => onNavigateToView('home')}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3.5 px-6 rounded-xl font-bold transition-all shadow-lg shadow-slate-900/20"
        >
          Voltar ao Início
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
