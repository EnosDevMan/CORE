import React from 'react';
import { CalendarClock, CheckCircle } from 'lucide-react';
import { Booking, BookingStatus } from '../types';

interface BookingStatusActionsProps {
  booking: Booking;
  handleStatusChange: (id: string, status: BookingStatus) => void | Promise<void>;
  onReschedule?: (booking: Booking) => void;
}

/**
 * Ações da máquina de estados operacional de um agendamento.
 *
 * Estados finais (e estados que não fazem parte do fluxo operacional) não
 * recebem ações. Dessa forma, todas as telas oferecem exatamente as mesmas
 * transições e nenhuma delas precisa conhecer as regras do fluxo.
 */
export const BookingStatusActions: React.FC<BookingStatusActionsProps> = ({
  booking,
  handleStatusChange,
  onReschedule,
}) => {
  const isActive =
    booking.status === 'Aguardando pagamento' ||
    booking.status === 'Confirmado' ||
    booking.status === 'Em atendimento';

  if (!isActive) return null;

  return (
    <>
      {booking.status === 'Aguardando pagamento' && (
        <button
          onClick={() => handleStatusChange(booking.id, 'Confirmado')}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
        >
          <CheckCircle size={12} /> Confirmar PIX
        </button>
      )}
      {booking.status === 'Confirmado' && (
        <button
          onClick={() => handleStatusChange(booking.id, 'Concluído')}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 cursor-pointer"
        >
          <CheckCircle size={12} /> Cliente atendido
        </button>
      )}
      {onReschedule && booking.status !== 'Em atendimento' && <button
        onClick={() => onReschedule(booking)}
        className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1"
      ><CalendarClock size={12} /> Reagendar</button>}
      <button
        onClick={() => handleStatusChange(booking.id, 'Não compareceu')}
        className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs py-1.5 px-3 rounded-lg cursor-pointer"
      >
        Faltou
      </button>
      <button
        onClick={() => handleStatusChange(booking.id, 'Cancelado')}
        className="bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs py-1.5 px-3 rounded-lg cursor-pointer"
      >
        Cancelar
      </button>
    </>
  );
};
