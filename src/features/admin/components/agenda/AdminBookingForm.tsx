import React, { useEffect, useState } from 'react';
import { useApp } from '../../../../store/useApp';
import { BookingStatus } from '../../../../types';
import { getErrorMessage } from '../../../../utils/errors';
import { validatePhoneBR } from '../../../../utils/validation';

interface AdminBookingFormProps {
  showFeedback: (msg: string, isError: boolean) => void;
  onSuccess?: () => void;
}

export const AdminBookingForm: React.FC<AdminBookingFormProps> = ({ showFeedback, onSuccess }) => {
  const { professionals, services, getAvailableSlots, addAdministrativeBooking } = useApp();

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
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsError, setSlotsError] = useState('');
  const [slotsAttempt, setSlotsAttempt] = useState(0);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (!adminProfessionalId || !adminServiceId || !adminDate) { setSlots([]); setSlotsError(''); return; }
    let active = true;
    setLoadingSlots(true); setSlotsError('');
    void getAvailableSlots(adminProfessionalId, adminServiceId, adminDate, undefined, undefined, true)
      .then(values => { if (active) setSlots(values); })
      .catch(error => { if (active) { setSlots([]); setSlotsError(getErrorMessage(error, 'Não foi possível consultar os horários.')); } })
      .finally(() => { if (active) setLoadingSlots(false); });
    return () => { active = false; };
  }, [adminProfessionalId, adminServiceId, adminDate, getAvailableSlots, slotsAttempt]);

  const handleAdminBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const customerName = adminCustName.trim();
    const customerPhone = adminCustPhone.trim();
    if (!customerName || !customerPhone || !adminProfessionalId || !adminServiceId || !adminDate || !adminTime) {
      showFeedback('Por favor, preencha todos os campos obrigatórios.', true);
      return;
    }
    if (customerName.length < 2 || customerName.length > 100) {
      showFeedback('O nome do cliente deve ter entre 2 e 100 caracteres.', true);
      return;
    }
    if (!validatePhoneBR(customerPhone)) {
      showFeedback('Informe um telefone brasileiro válido com DDD.', true);
      return;
    }

    if (!slots.includes(adminTime)) {
      showFeedback('Erro: Este horário não está mais disponível. Consulte os horários novamente.', true);
      return;
    }

    const val = adminServiceId.split(',').reduce((sum, subId) => {
      const s = services.find(x => x.id === subId.trim());
      return sum + (s ? s.price : 0);
    }, 0);

    setIsSaving(true);
    try {
      await addAdministrativeBooking({
        // 'guest' é o sentinel que dataService.createBooking já converte para
        // customer_id = null. O valor anterior (`cust-admin-${Date.now()}`)
        // não é um UUID válido e fazia essa gravação falhar sempre, com um
        // erro de tipo do Postgres, todas as vezes que o admin cadastrava um
        // agendamento manualmente (walk-in).
        customerId: 'guest',
        customerName,
        customerPhone,
        professionalId: adminProfessionalId,
        serviceId: adminServiceId,
        date: adminDate,
        time: adminTime,
        status: adminStatus,
        value: val,
        feePaid: adminFeePaid,
        notes: adminNotes.trim()
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
      setAdminFeePaid(true);
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
        <input type="text" required minLength={2} maxLength={100} value={adminCustName} onChange={(e) => setAdminCustName(e.target.value)} placeholder="Nome do Cliente *" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium" />
        <input type="tel" required maxLength={32} value={adminCustPhone} onChange={(e) => setAdminCustPhone(e.target.value)} placeholder="WhatsApp *" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium" />

        <p className="font-bold text-slate-500 uppercase tracking-wide">3. Serviço e data</p>
        <select required value={adminServiceId} onChange={(e) => setAdminServiceId(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium bg-white">
          <option value="">Selecione o Serviço *</option>
          {services.filter(service => service.active !== false).map(s => <option key={s.id} value={s.id}>{s.name} - R$ {s.price}</option>)}
        </select>

        <input type="date" required value={adminDate} onChange={(e) => { setAdminDate(e.target.value); setAdminTime(''); }} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium bg-white text-base" />
        {selectedService && <p className="text-slate-500">Duração: <strong>{selectedService.duration} min</strong></p>}

        <p className="font-bold text-slate-500 uppercase tracking-wide">4. Horário</p>
        {slotsError ? <div className="rounded-lg bg-slate-50 p-3 text-slate-600">{slotsError} <button type="button" className="font-bold" onClick={() => setSlotsAttempt(value => value + 1)}>Tentar novamente</button></div> : loadingSlots ? <div className="rounded-lg bg-slate-50 p-3 text-slate-500">Consultando horários...</div> : adminDate && slots.length === 0 ? <div className="rounded-lg bg-slate-50 p-3 text-slate-500">Não há horários disponíveis nesta data.</div> : null}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {slots.map(slot => <button key={slot} type="button" onClick={() => setAdminTime(slot)} className={`rounded-lg border px-2 py-2 font-bold transition-colors ${adminTime === slot ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-500'}`}>
            {slot}<span className="block text-[9px]">Livre</span>
          </button>)}
        </div>
        <input type="text" maxLength={1000} value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Observações" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium" />
        
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
