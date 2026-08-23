import React, { useMemo, useState } from 'react';
import { useApp } from '../../../../store/useApp';
import { BookingStatus } from '../../../../types';
import { getErrorMessage } from '../../../../utils/errors';

interface AdminBookingFormProps {
  showFeedback: (msg: string, isError: boolean) => void;
  onSuccess?: () => void;
}

export const AdminBookingForm: React.FC<AdminBookingFormProps> = ({ showFeedback, onSuccess }) => {
  const { professionals, services, isSlotAvailable, getAvailabilitySlots, addBooking } = useApp();

  const [adminCustName, setAdminCustName] = useState('');
  const [adminCustPhone, setAdminCustPhone] = useState('');
  const [adminProfessionalId, setAdminProfessionalId] = useState('');
  const [adminServiceId, setAdminServiceId] = useState('');
  const [adminDate, setAdminDate] = useState('');
  const [adminTime, setAdminTime] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [adminFeePaid, setAdminFeePaid] = useState(true);
  const [adminStatus, setAdminStatus] = useState<BookingStatus>('Confirmado');
  const [isSaving, setIsSaving] = useState(false);
  const selectedService = services.find(service => service.id === adminServiceId);
  const hasAvailabilityEngine = typeof getAvailabilitySlots === 'function';
  const slots = useMemo(() => hasAvailabilityEngine && adminProfessionalId && adminServiceId && adminDate
    ? getAvailabilitySlots(adminProfessionalId, adminServiceId, adminDate, true)
    : [], [hasAvailabilityEngine, adminProfessionalId, adminServiceId, adminDate, getAvailabilitySlots]);

  const handleAdminBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!adminCustName || !adminCustPhone || !adminProfessionalId || !adminServiceId || !adminDate || !adminTime) {
      showFeedback('Por favor, preencha todos os campos obrigatórios.', true);
      return;
    }

    const duration = adminServiceId.split(',').reduce((sum, subId) => {
      const s = services.find(x => x.id === subId.trim());
      return sum + (s ? s.duration : 0);
    }, 0);

    const isAvailable = isSlotAvailable(adminProfessionalId, adminDate, adminTime, duration);

    if (!isAvailable) {
      showFeedback('Erro: Este horário não está mais disponível ou conflita com outro agendamento/bloqueio.', true);
      return;
    }

    const val = adminServiceId.split(',').reduce((sum, subId) => {
      const s = services.find(x => x.id === subId.trim());
      return sum + (s ? s.price : 0);
    }, 0);

    setIsSaving(true);
    try {
      await addBooking({
        // 'guest' é o sentinel que dataService.createBooking já converte para
        // customer_id = null. O valor anterior (`cust-admin-${Date.now()}`)
        // não é um UUID válido e fazia essa gravação falhar sempre, com um
        // erro de tipo do Postgres, todas as vezes que o admin cadastrava um
        // agendamento manualmente (walk-in).
        customerId: 'guest',
        customerName: adminCustName,
        customerPhone: adminCustPhone,
        professionalId: adminProfessionalId,
        serviceId: adminServiceId,
        date: adminDate,
        time: adminTime,
        status: adminStatus,
        value: val,
        feePaid: adminFeePaid,
        notes: adminNotes
      });

      showFeedback('Agendamento confirmado com sucesso', false);

      // Limpa e fecha o formulário somente depois da confirmação do banco.
      setAdminCustName('');
      setAdminCustPhone('');
      setAdminProfessionalId('');
      setAdminServiceId('');
      setAdminDate('');
      setAdminTime('');
      setAdminNotes('');
      setAdminStatus('Confirmado');

      onSuccess?.();
    } catch (err) {
      showFeedback(getErrorMessage(err, 'Erro ao salvar agendamento. Tente novamente.'), true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleAdminBookingSubmit} className="space-y-4 border-t border-slate-100 pt-4 mb-4 text-xs" noValidate>
      <div className="space-y-3">
        <p className="font-bold text-slate-500 uppercase tracking-wide">1. Profissional</p>
        <select required value={adminProfessionalId} onChange={(e) => setAdminProfessionalId(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium bg-white">
          <option value="">Selecione o Profissional *</option>
          {professionals.filter(b => b.active !== false).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>

        <p className="font-bold text-slate-500 uppercase tracking-wide">2. Cliente</p>
        <input type="text" required value={adminCustName} onChange={(e) => setAdminCustName(e.target.value)} placeholder="Nome do Cliente *" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium" />
        <input type="tel" required value={adminCustPhone} onChange={(e) => setAdminCustPhone(e.target.value)} placeholder="WhatsApp *" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium" />

        <p className="font-bold text-slate-500 uppercase tracking-wide">3. Serviço e data</p>
        <select required value={adminServiceId} onChange={(e) => setAdminServiceId(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium bg-white">
          <option value="">Selecione o Serviço *</option>
          {services.map(s => <option key={s.id} value={s.id}>{s.name} - R$ {s.price}</option>)}
        </select>

        <input type="date" required value={adminDate} onChange={(e) => { setAdminDate(e.target.value); setAdminTime(''); }} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium bg-white text-base" />
        {selectedService && <p className="text-slate-500">Duração: <strong>{selectedService.duration} min</strong></p>}

        <p className="font-bold text-slate-500 uppercase tracking-wide">4. Horário</p>
        {adminDate && slots.length === 0 && <div className="rounded-lg bg-slate-50 p-3 text-slate-500">Estabelecimento ou profissional fechado nesta data.</div>}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {slots.map(slot => <button key={slot.time} type="button" disabled={slot.status !== 'available'} title={slot.reason} onClick={() => setAdminTime(slot.time)} className={`rounded-lg border px-2 py-2 font-bold transition-colors ${adminTime === slot.time ? 'bg-indigo-600 text-white border-indigo-600' : slot.status === 'available' ? 'bg-white text-slate-800 border-slate-200 hover:border-indigo-500' : 'bg-slate-100 text-slate-400 border-slate-100 line-through cursor-not-allowed'}`}>
            {slot.time}<span className="block text-[9px] no-underline">{slot.status === 'available' ? 'Livre' : slot.reason}</span>
          </button>)}
        </div>
        {!hasAvailabilityEngine && <input aria-label="Horário" type="time" required value={adminTime} onChange={event => setAdminTime(event.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white" />}

        <input type="text" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Observações" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium" />
        
        <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
          <input type="checkbox" checked={adminFeePaid} onChange={(e) => setAdminFeePaid(e.target.checked)} className="rounded" />
          Taxa paga pelo cliente
        </label>
        
        <select required value={adminStatus} onChange={(e) => setAdminStatus(e.target.value as BookingStatus)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium bg-white">
          <option value="Confirmado">Confirmado</option>
          <option value="Concluído">Concluído</option>
        </select>

        <button type="submit" disabled={isSaving} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 text-white py-2 rounded-lg font-bold transition-colors shadow-sm">
          {isSaving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  );
};
