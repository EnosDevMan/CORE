import React, { useState } from 'react';
import { CalendarClock, CheckCircle } from 'lucide-react';
import { Booking, BookingStatus } from '../types';

interface BookingStatusActionsProps {
  booking: Booking;
  handleStatusChange: (id: string, status: BookingStatus) => void | Promise<void>;
  onReschedule?: (booking: Booking) => void;
  context?: 'operational' | 'upcoming';
}

/**
 * Ações da máquina de estados operacional de um agendamento.
 *
 * Estados finais (e estados que não fazem parte do fluxo operacional) não
 * recebem ações. O contexto futuro oculta avanços que só fazem sentido no dia
 * do atendimento, sem duplicar handlers ou estados de gravação em cada tela.
 */
export const BookingStatusActions: React.FC<BookingStatusActionsProps> = ({
  booking,
  handleStatusChange,
  onReschedule,
  context = 'operational',
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const isActive =
    booking.status === 'Aguardando pagamento' ||
    booking.status === 'Confirmado' ||
    booking.status === 'Em atendimento';
  const canMarkNoShow =
    !booking.startsAt || new Date(booking.startsAt).getTime() <= Date.now();

  if (!isActive) return null;

  const requestStatusChange = async (status: BookingStatus) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      const result = handleStatusChange(booking.id, status);
      if (result) await result;
    } finally {
      setIsUpdating(false);
    }
  };

  const actionStateClass = isUpdating ? ' disabled:cursor-wait disabled:opacity-60' : '';

  return (
    <>
      {booking.status === 'Aguardando pagamento' && (
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => void requestStatusChange('Confirmado')}
          className={`bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 cursor-pointer transition-colors${actionStateClass}`}
        >
          <CheckCircle size={12} /> Confirmar PIX
        </button>
      )}
      {context === 'operational' && booking.status === 'Confirmado' && (
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => void requestStatusChange('Em atendimento')}
          className={`bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 cursor-pointer${actionStateClass}`}
        >
          <CheckCircle size={12} /> Iniciar atendimento
        </button>
      )}
      {context === 'operational' && booking.status === 'Em atendimento' && (
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => void requestStatusChange('Concluído')}
          className={`bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 cursor-pointer${actionStateClass}`}
        >
          <CheckCircle size={12} /> Concluir atendimento
        </button>
      )}
      {onReschedule && booking.status !== 'Em atendimento' && (
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => onReschedule(booking)}
          className={`bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1${actionStateClass}`}
        >
          <CalendarClock size={12} /> Reagendar
        </button>
      )}
      {context === 'operational' && canMarkNoShow && (
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => void requestStatusChange('Não compareceu')}
          className={`bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs py-1.5 px-3 rounded-lg cursor-pointer${actionStateClass}`}
        >
          Faltou
        </button>
      )}
      <button
        type="button"
        disabled={isUpdating}
        onClick={() => void requestStatusChange('Cancelado')}
        className={`bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs py-1.5 px-3 rounded-lg cursor-pointer${actionStateClass}`}
      >
        Cancelar
      </button>
    </>
  );
};
