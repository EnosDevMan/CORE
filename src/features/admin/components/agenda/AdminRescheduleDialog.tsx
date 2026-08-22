import React, { useMemo, useState } from 'react';
import { CalendarClock, X } from 'lucide-react';
import { Booking } from '../../../../types';
import { useApp } from '../../../../store/useApp';
import { getBarbershopTodayStr } from '../../../../utils/validation';
import { getErrorMessage } from '../../../../utils/errors';

interface Props {
  booking: Booking;
  onClose: () => void;
  showFeedback: (message: string, isError: boolean) => void;
}

export const AdminRescheduleDialog: React.FC<Props> = ({ booking, onClose, showFeedback }) => {
  const { services, getAvailabilitySlots, rescheduleBooking } = useApp();
  const [date, setDate] = useState(booking.date);
  const [time, setTime] = useState(booking.time);
  const [saving, setSaving] = useState(false);
  const slots = useMemo(() => getAvailabilitySlots(
    booking.barberId, booking.serviceId, date, true, booking.id
  ), [booking, date, getAvailabilitySlots]);
  const service = services.find(item => item.id === booking.serviceId);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await rescheduleBooking(booking.id, date, time);
      showFeedback('Agendamento reagendado com sucesso. O histórico foi preservado.', false);
      onClose();
    } catch (error) {
      showFeedback(getErrorMessage(error, 'Não foi possível reagendar. Verifique a disponibilidade.'), true);
    } finally { setSaving(false); }
  };

  return <div className="fixed inset-0 z-50 bg-slate-950/60 p-4 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="reschedule-title">
    <form onSubmit={submit} className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div><h2 id="reschedule-title" className="font-extrabold text-slate-900 flex items-center gap-2"><CalendarClock size={20} /> Reagendar {booking.customerName}</h2>
          <p className="text-xs text-slate-500 mt-1">Mesmo agendamento, profissional e serviço ({service?.name}).</p></div>
        <button type="button" onClick={onClose} aria-label="Fechar" className="p-2 rounded-lg hover:bg-slate-100"><X size={18} /></button>
      </div>
      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Nova data</label>
      <input type="date" min={getBarbershopTodayStr()} value={date} onChange={event => { setDate(event.target.value); setTime(''); }} className="w-full border border-slate-200 rounded-xl p-3 bg-white mb-4" required />
      <p className="text-xs font-bold text-slate-600 uppercase mb-2">Novo horário</p>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-5">
        {slots.map(slot => <button key={slot.time} type="button" disabled={slot.status !== 'available'} onClick={() => setTime(slot.time)} className={`p-2 rounded-lg border text-xs font-bold ${time === slot.time ? 'bg-indigo-600 border-indigo-600 text-white' : slot.status === 'available' ? 'border-slate-200' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>{slot.time}</button>)}
      </div>
      {slots.length === 0 && <p className="text-sm text-slate-500 bg-slate-50 rounded-xl p-4 mb-5">Não há horários disponíveis nesta data.</p>}
      <button disabled={!time || saving || (date === booking.date && time === booking.time)} className="w-full bg-indigo-600 disabled:opacity-50 text-white rounded-xl py-3 font-bold">{saving ? 'Reagendando...' : 'Confirmar reagendamento'}</button>
    </form>
  </div>;
};
