import React, { useEffect, useState } from 'react';
import { CalendarClock, X } from 'lucide-react';
import { Booking } from '../../../../types';
import { useApp } from '../../../../store/useApp';
import { getBusinessTodayStr } from '../../../../utils/validation';
import { getErrorMessage } from '../../../../utils/errors';
import { useBusiness } from '../../../../core/business/hooks';
import { useModalAccessibility } from '../../../../hooks/useModalAccessibility';

interface Props {
  booking: Booking;
  onClose: () => void;
  showFeedback: (message: string, isError: boolean) => void;
  onRescheduled?: (booking: Booking) => void;
}

export const AdminRescheduleDialog: React.FC<Props> = ({ booking, onClose, showFeedback, onRescheduled }) => {
  const { services, getAvailableSlots, rescheduleBooking } = useApp();
  const { profile } = useBusiness();
  const [date, setDate] = useState(booking.date);
  const [time, setTime] = useState(booking.time);
  const [saving, setSaving] = useState(false);
  const modalRef = useModalAccessibility<HTMLDivElement>(true, onClose);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    let active = true;
    setLoadingSlots(true);
    void getAvailableSlots(booking.professionalId, booking.serviceId, date, booking.id, booking.durationMinutes)
      .then(values => { if (active) setSlots(values); })
      .catch(() => { if (active) setSlots([]); })
      .finally(() => { if (active) setLoadingSlots(false); });
    return () => { active = false; };
  }, [booking.durationMinutes, booking.id, booking.professionalId, booking.serviceId, date, getAvailableSlots]);
  const service = services.find(item => item.id === booking.serviceId);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await rescheduleBooking(booking.id, date, time, booking);
      onRescheduled?.({ ...booking, date, time });
      showFeedback('Agendamento reagendado com sucesso. O histórico foi preservado.', false);
      onClose();
    } catch (error) {
      showFeedback(getErrorMessage(error, 'Não foi possível reagendar. Verifique a disponibilidade.'), true);
    } finally { setSaving(false); }
  };

  return <div ref={modalRef} tabIndex={-1} className="fixed inset-0 z-50 bg-slate-950/60 p-4 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="reschedule-title">
    <form onSubmit={submit} className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div><h2 id="reschedule-title" className="font-extrabold text-slate-900 flex items-center gap-2"><CalendarClock size={20} /> Reagendar {booking.customerName}</h2>
          <p className="text-xs text-slate-500 mt-1">Mesmo agendamento, profissional e serviço ({service?.name}).</p></div>
        <button type="button" onClick={onClose} aria-label="Fechar" className="p-2 rounded-lg hover:bg-slate-100"><X size={18} /></button>
      </div>
      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Nova data</label>
      <input aria-label="Nova data" data-modal-initial-focus type="date" min={getBusinessTodayStr(profile.timezone)} value={date} onChange={event => { setDate(event.target.value); setTime(''); }} className="w-full border border-slate-200 rounded-xl p-3 bg-white mb-4" required />
      <p className="text-xs font-bold text-slate-600 uppercase mb-2">Novo horário</p>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-5">
        {slots.map(slot => <button key={slot} type="button" onClick={() => setTime(slot)} className={`p-2 rounded-lg border text-xs font-bold ${time === slot ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200'}`}>{slot}</button>)}
      </div>
      {loadingSlots ? <p className="text-sm text-slate-500 bg-slate-50 rounded-xl p-4 mb-5">Consultando horários...</p> : slots.length === 0 && <p className="text-sm text-slate-500 bg-slate-50 rounded-xl p-4 mb-5">Não há horários disponíveis nesta data.</p>}
      <button type="submit" disabled={!time || saving || (date === booking.date && time === booking.time)} className="w-full bg-indigo-600 disabled:opacity-50 text-white rounded-xl py-3 font-bold">{saving ? 'Reagendando...' : 'Confirmar reagendamento'}</button>
    </form>
  </div>;
};
