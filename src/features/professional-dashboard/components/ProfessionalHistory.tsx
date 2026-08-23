import React from 'react';
import { Booking, BookingStatus } from '../../../types';
import { formatBRL } from '../../../utils/validation';
import { BookingStatusActions } from '../../../components/BookingStatusActions';

interface ProfessionalHistoryProps {
  pastBookings: Booking[];
  getServiceName: (id: string) => string;
  getStatusBadgeColor: (status: BookingStatus) => string;
  handleStatusChange: (id: string, status: BookingStatus) => void | Promise<void>;
}

export const ProfessionalHistory: React.FC<ProfessionalHistoryProps> = ({
  pastBookings,
  getServiceName,
  getStatusBadgeColor,
  handleStatusChange,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      <h3 className="font-sans font-bold text-slate-800 text-xs uppercase tracking-wider mb-4 border-b border-slate-100 pb-3">
        Últimos Trabalhos ({pastBookings.length})
      </h3>
      {pastBookings.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {pastBookings.map(booking => (
            <div key={booking.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-xs">
              <div className="flex justify-between">
                <p className="font-bold text-slate-900">{getServiceName(booking.serviceId)}</p>
                <span className="font-mono font-bold text-slate-400 text-[10px]">{booking.date}</span>
              </div>
              {/* booking.value é o valor histórico real (congelado no
                  momento do agendamento) — evita mostrar um valor diferente
                  do que foi de fato cobrado caso o preço do serviço tenha
                  mudado (ou o serviço tenha sido excluído) depois. */}
              <p className="text-slate-400 mt-1 leading-snug">Cliente: {booking.customerName} • {formatBRL(booking.value)}</p>
              <span className={`inline-block mt-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${getStatusBadgeColor(booking.status)}`}>
                {booking.status}
              </span>
              <div className="flex gap-2 items-center flex-wrap mt-3">
                <BookingStatusActions booking={booking} handleStatusChange={handleStatusChange} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-400 text-xs">Nenhum atendimento anterior registrado.</p>
      )}
    </div>
  );
};
