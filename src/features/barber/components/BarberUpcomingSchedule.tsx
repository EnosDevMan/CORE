import React from 'react';
import { Booking, BookingStatus } from '../../../types';
import { CheckCircle, X } from 'lucide-react';

interface BarberUpcomingScheduleProps {
  futureBookings: Booking[];
  getServiceName: (id: string) => string;
  getFormattedDate: (dateStr: string) => string;
  getStatusBadgeColor: (status: BookingStatus) => string;
  handleStatusChange?: (id: string, status: BookingStatus) => void; // Nova prop
}

export const BarberUpcomingSchedule: React.FC<BarberUpcomingScheduleProps> = ({
  futureBookings,
  getServiceName,
  getFormattedDate,
  getStatusBadgeColor,
  handleStatusChange
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      <h3 className="font-sans font-extrabold text-sm uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3 mb-4">
        Próximos Dias ({futureBookings.length})
      </h3>
      {futureBookings.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {futureBookings.map(booking => (
            <div key={booking.id} className="py-4 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
              <div className="flex-1">
                <p className="font-bold text-slate-900">{getServiceName(booking.serviceId)}</p>
                <p className="text-slate-400 text-xs mt-0.5 capitalize">
                  {getFormattedDate(booking.date)} às {booking.time}h • Com {booking.customerName}
                </p>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap sm:justify-end sm:shrink-0">
                {/* Status Badge */}
                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded border whitespace-nowrap ${getStatusBadgeColor(booking.status)}`}>
                  {booking.status}
                </span>

                {/* Botão de Confirmação de Pagamento */}
                {handleStatusChange && booking.status === 'Aguardando pagamento' && (
                  <button
                    onClick={() => handleStatusChange(booking.id, 'Confirmado')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-1 px-2 rounded flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap"
                    title="Confirmar o pagamento desta reserva"
                  >
                    <CheckCircle size={11} /> Confirmar
                  </button>
                )}

                {/* Botão de Cancelamento */}
                {handleStatusChange && booking.status === 'Aguardando pagamento' && (
                  <button
                    onClick={() => handleStatusChange(booking.id, 'Cancelado')}
                    className="bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs py-1 px-2 rounded flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap"
                    title="Cancelar esta reserva"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-400 text-xs py-4">Nenhum agendamento futuro marcado.</p>
      )}
    </div>
  );
};
