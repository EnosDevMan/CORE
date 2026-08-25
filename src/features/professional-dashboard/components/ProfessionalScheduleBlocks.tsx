import React, { useMemo, useState } from 'react';
import { Ban, CalendarX2, Trash2 } from 'lucide-react';
import { useApp } from '../../../store/useApp';
import { getErrorMessage } from '../../../utils/errors';

interface Props {
  professionalId: string;
  showFeedback: (message: string, isError?: boolean) => void;
}

export const ProfessionalScheduleBlocks: React.FC<Props> = ({ professionalId, showFeedback }) => {
  const { scheduleBlocks, addScheduleBlock, deleteScheduleBlock } = useApp();
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const ownTimedBlocks = useMemo(() => scheduleBlocks
    .filter(block => block.professionalId === professionalId && block.type === 'block')
    .sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`)), [professionalId, scheduleBlocks]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!date || !startTime || !endTime || !reason.trim()) {
      showFeedback('Preencha a data, o intervalo e o motivo do bloqueio.', true);
      return;
    }
    if (startTime >= endTime) {
      showFeedback('O fim do bloqueio precisa ser posterior ao início.', true);
      return;
    }

    setSaving(true);
    try {
      await addScheduleBlock({ professionalId: professionalId, type: 'block', date, startTime, endTime, reason: reason.trim() });
      setReason('');
      showFeedback('Horário bloqueado na sua agenda.');
    } catch (error) {
      showFeedback(getErrorMessage(error, 'Não foi possível bloquear o horário.'), true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteScheduleBlock(id);
      showFeedback('Bloqueio removido da sua agenda.');
    } catch (error) {
      showFeedback(getErrorMessage(error, 'Não foi possível remover o bloqueio.'), true);
    }
  };

  return (
    <section aria-labelledby="blocks-heading" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="rounded-xl bg-rose-50 p-2 text-rose-600"><CalendarX2 size={20} /></span>
        <div>
          <h3 id="blocks-heading" className="font-black text-slate-900">Bloquear um horário</h3>
          <p className="mt-1 text-xs text-slate-500">Marque um imprevisto ou compromisso. Clientes não poderão agendar durante esse intervalo.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="text-xs font-bold text-slate-600">Data
          <input aria-label="Data do bloqueio" type="date" required value={date} onChange={event => setDate(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-medium text-slate-900" />
        </label>
        <label className="text-xs font-bold text-slate-600">Início
          <input aria-label="Início do bloqueio" type="time" required value={startTime} onChange={event => setStartTime(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-medium text-slate-900" />
        </label>
        <label className="text-xs font-bold text-slate-600">Fim
          <input aria-label="Fim do bloqueio" type="time" required value={endTime} onChange={event => setEndTime(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-medium text-slate-900" />
        </label>
        <label className="text-xs font-bold text-slate-600 lg:col-span-1">Motivo
          <input aria-label="Motivo do bloqueio" type="text" required maxLength={120} value={reason} onChange={event => setReason(event.target.value)} placeholder="Ex.: consulta" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-medium text-slate-900" />
        </label>
        <button type="submit" disabled={saving || !professionalId} className="self-end rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-slate-800 disabled:opacity-50">
          <Ban className="mr-1.5 inline" size={14} />{saving ? 'Salvando...' : 'Bloquear'}
        </button>
      </form>

      {ownTimedBlocks.length > 0 && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Meus bloqueios</p>
          <div className="flex flex-wrap gap-2">
            {ownTimedBlocks.map(block => (
              <div key={block.id} className="flex items-center gap-2 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-slate-700">
                <span><strong>{block.date?.split('-').reverse().join('/')}</strong> · {block.startTime}–{block.endTime} · {block.reason}</span>
                <button type="button" aria-label={`Remover bloqueio ${block.reason}`} onClick={() => handleDelete(block.id)} className="text-rose-600 hover:text-rose-800"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
