import React from 'react';
import { Calendar, Scissors, User, XCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Booking } from '../../../types';
import { getBusinessMaxBookingDateStr, getBusinessNow } from '../../../utils/validation';
import { useBusiness } from '../../../core/business/hooks';

interface BookingCardProps {
  booking: Booking;
  bookingWindowDays: number;
  getServiceName: (id: string) => string;
  getServiceDuration: (id: string) => number;
  getProfessionalName: (id: string) => string;
  formatBRL: (val: number) => string;
  getStatusBadge: (status: string) => React.ReactNode;
  isRescheduling: boolean;
  handleOpenReschedule: (booking: Booking) => void;
  handleCancel: (id: string) => void;
  handleConfirmAttendance?: (id: string) => void;
  newDate: string;
  newTime: string;
  availableTimes: string[];
  errorMsg: string;
  handleDateChange: (date: string, booking: Booking) => void;
  setNewTime: (time: string) => void;
  setReschedulingBookingId: (id: string | null) => void;
  handleConfirmReschedule: (id: string) => void;
}

export const BookingCard: React.FC<BookingCardProps> = React.memo(({
  booking,
  bookingWindowDays,
  getServiceName,
  getServiceDuration,
  getProfessionalName,
  formatBRL,
  getStatusBadge,
  isRescheduling,
  handleOpenReschedule,
  handleCancel,
  handleConfirmAttendance,
  newDate,
  newTime,
  availableTimes,
  errorMsg,
  handleDateChange,
  setNewTime,
  setReschedulingBookingId,
  handleConfirmReschedule
}) => {
  const { profile } = useBusiness();
  // Compara com "agora" no fuso horário do negócio, não no fuso do
  // dispositivo do cliente — evita marcar agendamentos como "passados" (ou
  // deixar de marcar) incorretamente para clientes acessando de outro fuso.
  const { dateStr: nowDateStr, hours: nowHours, minutes: nowMinutes } = getBusinessNow(profile.timezone);
  const isPast =
    booking.date < nowDateStr ||
    (booking.date === nowDateStr && booking.time <= `${String(nowHours).padStart(2, '0')}:${String(nowMinutes).padStart(2, '0')}`);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col hover:border-slate-300 hover:shadow-md transition-all">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        {/* Info */}
        <div className="flex items-start gap-4">
          <div className="bg-slate-50 text-slate-700 w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 shadow-sm">
            <Calendar size={20} />
          </div>
          <div>
            <h4 className="font-sans font-extrabold text-slate-900 text-lg flex items-center gap-2">
              {new Date(booking.date + "T12:00:00").toLocaleDateString('pt-BR')} às {booking.time}h
            </h4>
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <User size={12} className="text-slate-400" />
                <span>{getProfessionalName(booking.professionalId)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <Scissors size={12} className="text-slate-400" />
                <div>
                  <p className="font-extrabold text-slate-900 text-sm mt-0.5">{getServiceName(booking.serviceId)}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {booking.durationMinutes ?? getServiceDuration(booking.serviceId)} min • {formatBRL(booking.value)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row md:flex-col justify-between items-end gap-3 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
          <div className="flex flex-col items-end gap-1.5 w-full sm:w-auto md:w-full">
            <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
              Reserva: {getStatusBadge(booking.status)}
              {booking.customerConfirmed && (
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 size={10} /> Presença Confirmada
                </span>
              )}
            </span>
            {booking.notes && (
              <p className="text-[11px] text-slate-400 italic text-right max-w-xs line-clamp-1">"{booking.notes}"</p>
            )}
          </div>

          {!isRescheduling && !isPast && booking.status !== 'Cancelado' ? (
            <div className="flex flex-wrap gap-2 w-full sm:w-auto md:w-full justify-end">
              {!booking.customerConfirmed && handleConfirmAttendance && (
                <button
                  onClick={() => handleConfirmAttendance(booking.id)}
                  className="flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs py-2 px-3 rounded-lg transition-colors cursor-pointer"
                >
                  <CheckCircle2 size={12} /> Confirmar
                </button>
              )}
              <button
                onClick={() => handleOpenReschedule(booking)}
                className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 px-3 rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw size={12} /> Reagendar
              </button>
              <button
                onClick={() => handleCancel(booking.id)}
                className="flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs py-2 px-3 rounded-lg transition-colors cursor-pointer"
              >
                <XCircle size={12} /> Cancelar
              </button>
            </div>
          ) : isRescheduling ? (
            <span className="text-xs text-indigo-600 font-bold">Editando agendamento...</span>
          ) : null}
        </div>
      </div>

      {/* Editor */}
      {isRescheduling && (
        <div className="w-full mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-3">
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h5 className="font-bold text-xs text-slate-800">Escolha Nova Data</h5>
            <input
              type="date"
              value={newDate}
              onChange={(e) => handleDateChange(e.target.value, booking)}
              min={nowDateStr}
              max={getBusinessMaxBookingDateStr(bookingWindowDays, profile.timezone)}
              className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-semibold text-slate-800"
            />
            {errorMsg && <p className="text-[11px] text-red-600 font-bold">{errorMsg}</p>}
          </div>

          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
            <div>
              <h5 className="font-bold text-xs text-slate-800 mb-2">Horários Disponíveis</h5>
              {availableTimes.length > 0 ? (
                <div className="grid grid-cols-4 gap-1 max-h-[100px] overflow-y-auto">
                  {availableTimes.map(time => (
                    <button
                      key={time}
                      onClick={() => setNewTime(time)}
                      className={`py-1 px-0.5 text-center font-bold text-[10px] rounded border ${
                        newTime === time
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-slate-500">Sem horários para este dia.</p>
              )}
            </div>
            
            <div className="flex gap-2 justify-end pt-4">
              <button
                onClick={() => setReschedulingBookingId(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 py-1.5 px-3 rounded-lg text-xs font-bold"
              >
                Voltar
              </button>
              <button
                onClick={() => handleConfirmReschedule(booking.id)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white py-1.5 px-3 rounded-lg text-xs font-bold"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
