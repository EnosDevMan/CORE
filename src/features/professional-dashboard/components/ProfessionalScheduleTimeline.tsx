import React from 'react';
import { Clock, User, Phone, MessageSquare } from 'lucide-react';
import { Booking, BookingStatus, BusinessConfig } from '../../../types';
import { BookingStatusActions } from '../../../components/BookingStatusActions';

interface ProfessionalScheduleTimelineProps {
  todayBookings: Booking[];
  config: BusinessConfig;
  getServiceName: (id: string) => string;
  getStatusBadgeColor: (status: BookingStatus) => string;
  getWhatsAppLink: (booking: Booking) => string | null;
  handleStatusChange: (id: string, status: BookingStatus) => void;
}

export const ProfessionalScheduleTimeline: React.FC<ProfessionalScheduleTimelineProps> = ({
  todayBookings,
  getServiceName,
  getStatusBadgeColor,
  getWhatsAppLink,
  handleStatusChange
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      <h3 className="font-sans font-extrabold text-lg text-slate-900 border-b border-slate-100 pb-4 mb-6 flex items-center gap-2">
        <Clock size={18} className="text-slate-700" />
        Sua Agenda de Hoje ({todayBookings.length})
      </h3>
      {todayBookings.length > 0 ? (
        <div className="relative border-l border-slate-100 pl-6 ml-3 space-y-6">
          {todayBookings.map(booking => (
            <div key={booking.id} className="relative group animate-in fade-in">
              <div className={`absolute left-[-31px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white ${
                booking.status === 'Em atendimento'
                  ? 'bg-indigo-600 ring-indigo-50 animate-ping'
                  : booking.status === 'Concluído'
                  ? 'bg-slate-400'
                  : 'bg-emerald-500'
              }`} />
              <div className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col sm:flex-row justify-between gap-4 transition-all">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-extrabold text-sm text-slate-900">{booking.time}h</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border ${getStatusBadgeColor(booking.status)}`}>
                      {booking.status}
                    </span>
                    {booking.notes?.includes('[PROMOÇÃO]') && (
                      <span className="inline-flex items-center gap-0.5 bg-emerald-500/10 text-emerald-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                        🎉 1º Grátis
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm md:text-base mt-1">
                    {getServiceName(booking.serviceId)}
                  </h4>
                  <div className="flex flex-col gap-1 text-xs text-slate-500 pt-1.5 font-medium">
                    <p className="flex items-center gap-1.5"><User size={13} /> {booking.customerName}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="flex items-center gap-1.5"><Phone size={13} /> {booking.customerPhone}</p>
                      {getWhatsAppLink(booking) ? (
                        <a
                          href={getWhatsAppLink(booking)!}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-0.5 text-emerald-600 hover:text-emerald-700 font-extrabold text-[9px] bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded transition-colors"
                          title="Enviar notificação ou entrar em contato"
                        >
                          <MessageSquare size={9} className="fill-emerald-600 text-emerald-600" /> WhatsApp
                        </a>
                      ) : (
                        <span
                          className="inline-flex items-center gap-0.5 text-slate-300 font-extrabold text-[9px] bg-slate-50 px-1.5 py-0.5 rounded cursor-not-allowed"
                          title="Telefone do cliente inválido"
                        >
                          <MessageSquare size={9} /> WhatsApp
                        </span>
                      )}
                    </div>
                    {booking.notes && (
                      <p className="text-[11px] text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md max-w-lg mt-1 italic">
                        "{booking.notes}"
                      </p>
                    )}
                  </div>
                </div>
                {/* Actions */}
                <div className="flex gap-2 shrink-0 items-center border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 justify-end flex-wrap">
                  <BookingStatusActions booking={booking} handleStatusChange={handleStatusChange} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          Não há agendamentos para o dia de hoje.
        </div>
      )}
    </div>
  );
};
