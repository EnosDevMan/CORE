import React, { useState } from 'react';
import { useApp } from '../../../../store/useApp';
import { BlockType, ScheduleBlock } from '../../../../types';
import { Ban } from 'lucide-react';
import { getErrorMessage } from '../../../../utils/errors';

interface ScheduleBlockFormProps {
  showFeedback: (msg: string, isError: boolean) => void;
}

export const ScheduleBlockForm: React.FC<ScheduleBlockFormProps> = ({ showFeedback }) => {
  const { professionals, scheduleBlocks, addScheduleBlock, deleteScheduleBlock } = useApp();

  // 'special_hours' é uma opção só de UI (ajuda o admin a diferenciar
  // visualmente "feriado fechado" de "dia com horário especial"), mas o
  // banco (enum block_type) só aceita 'block' | 'offday' | 'vacation' |
  // 'special'. Antes, o valor 'special_hours' era salvo como está e a
  // gravação sempre falhava (violação do enum no Postgres). Agora mapeamos
  // para 'special' na hora de montar o payload, mantendo os dados de
  // specialHours.
  type BlockFormType = BlockType | 'special_hours';
  const [blockProfessionalId, setBlockProfessionalId] = useState<string>('all');
  const [blockType, setBlockType] = useState<BlockFormType>('block');
  const [blockDate, setBlockDate] = useState<string>('');
  const [blockStartDate, setBlockStartDate] = useState<string>('');
  const [blockEndDate, setBlockEndDate] = useState<string>('');
  const [blockStartTime, setBlockStartTime] = useState<string>('09:00');
  const [blockEndTime, setBlockEndTime] = useState<string>('10:00');
  const [blockReason, setBlockReason] = useState<string>('');
  // Modo explícito para o bloqueio de férias (dia único vs período) — antes
  // era inferido de `blockEndDate === '' && !blockStartDate`, que ficava
  // dessincronizado do que o usuário via na tela (ex: digitar uma data de
  // início e depois clicar em "Um dia" não voltava pro campo de dia único,
  // porque `blockStartDate` continuava preenchido).
  const [vacationMode, setVacationMode] = useState<'single' | 'range'>('single');
  
  const [specialOpen, setSpecialOpen] = useState<string>('09:00');
  const [specialClose, setSpecialClose] = useState<string>('18:00');
  const [specialBreakStart, setSpecialBreakStart] = useState<string>('12:00');
  const [specialBreakEnd, setSpecialBreakEnd] = useState<string>('13:00');
  const [useSpecialBreak, setUseSpecialBreak] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSaveScheduleBlock = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedReason = blockReason.trim();
    if (!normalizedReason) {
      showFeedback('Informe o motivo do bloqueio.', true);
      return;
    }
    if (normalizedReason.length > 200) {
      showFeedback('O motivo deve ter no máximo 200 caracteres.', true);
      return;
    }

    if (blockType === 'block' && (!blockDate || !blockStartTime || !blockEndTime)) {
      showFeedback('Preencha a data e o horário de início/fim do bloqueio.', true);
      return;
    }
    if (blockType === 'block' && blockStartTime >= blockEndTime) {
      showFeedback('O fim do bloqueio precisa ser posterior ao início.', true);
      return;
    }
    if (blockType === 'vacation') {
      if (vacationMode === 'single' && !blockDate) {
        showFeedback('Informe a data da folga.', true);
        return;
      }
      if (vacationMode === 'range' && (!blockStartDate || !blockEndDate)) {
        showFeedback('Informe a data de início e fim das férias.', true);
        return;
      }
      if (vacationMode === 'range' && blockStartDate > blockEndDate) {
        showFeedback('A data final das férias não pode ser anterior à data inicial.', true);
        return;
      }
    }
    if (blockType === 'special' && (!blockStartDate || !blockEndDate)) {
      showFeedback('Informe o período do feriado/data comemorativa.', true);
      return;
    }
    if (blockType === 'special' && blockStartDate > blockEndDate) {
      showFeedback('A data final do período não pode ser anterior à data inicial.', true);
      return;
    }
    if (blockType === 'special_hours') {
      if (!blockDate || !specialOpen || !specialClose) {
        showFeedback('Informe a data e o horário especial (abertura e fechamento).', true);
        return;
      }
      if (useSpecialBreak && (!specialBreakStart || !specialBreakEnd)) {
        showFeedback('Informe o início e fim da pausa, ou desmarque a opção de pausa.', true);
        return;
      }
      if (specialOpen >= specialClose) {
        showFeedback('A abertura especial precisa ser anterior ao fechamento.', true);
        return;
      }
      if (useSpecialBreak && (specialBreakStart >= specialBreakEnd || specialBreakStart < specialOpen || specialBreakEnd > specialClose)) {
        showFeedback('A pausa precisa estar dentro do horário especial e terminar depois de começar.', true);
        return;
      }
    }

    const newBlockData: Partial<ScheduleBlock> = {
      professionalId: blockProfessionalId,
      reason: normalizedReason,
    };

    if (blockType === 'block') {
      newBlockData.type = 'block';
      newBlockData.date = blockDate;
      newBlockData.startTime = blockStartTime;
      newBlockData.endTime = blockEndTime;
    } else if (blockType === 'vacation') {
      newBlockData.type = 'vacation';
      if (vacationMode === 'single') {
        newBlockData.date = blockDate;
      } else {
        newBlockData.startDate = blockStartDate;
        newBlockData.endDate = blockEndDate;
      }
    } else if (blockType === 'special') {
      newBlockData.type = 'special';
      newBlockData.startDate = blockStartDate;
      newBlockData.endDate = blockEndDate;
    } else if (blockType === 'special_hours') {
      // O horário customizado abaixo agora é respeitado de verdade no
      // cálculo de disponibilidade (ver src/store/appStore.ts e a
      // migration 0005_special_hours_availability.sql) — o dia deixa de
      // ser bloqueado por completo e passa a aceitar agendamento dentro
      // da janela especial (fora dela, e na pausa se configurada, continua
      // bloqueado).
      newBlockData.type = 'special';
      newBlockData.date = blockDate;
      newBlockData.specialHours = {
        open: specialOpen,
        close: specialClose,
        breakStart: useSpecialBreak ? specialBreakStart : undefined,
        breakEnd: useSpecialBreak ? specialBreakEnd : undefined
      };
    }

    setIsSaving(true);
    try {
      await addScheduleBlock(newBlockData as Omit<ScheduleBlock, 'id'>);
      showFeedback('Ausência/Bloqueio salvo com sucesso!', false);
      setBlockReason('');
      setBlockDate('');
      setBlockStartDate('');
      setBlockEndDate('');
    } catch (error) {
      showFeedback(getErrorMessage(error, 'Não foi possível salvar o bloqueio.'), true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteScheduleBlock = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteScheduleBlock(id);
      showFeedback('Bloqueio removido com sucesso!', false);
    } catch (error) {
      showFeedback(getErrorMessage(error, 'Não foi possível remover o bloqueio.'), true);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <form onSubmit={handleSaveScheduleBlock} className="space-y-4 text-xs" noValidate>
        <select value={blockProfessionalId} onChange={(e) => setBlockProfessionalId(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white">
          <option value="all">Todos os Profissionais (Salão)</option>
          {professionals.filter(b => b.active !== false).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        
        <select value={blockType} onChange={(e) => setBlockType(e.target.value as BlockFormType)} className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white">
          <option value="block">Bloqueio de Horário Específico</option>
          <option value="vacation">Férias / Ausência Dia(s)</option>
          <option value="special">Feriado / Data Comemorativa</option>
          <option value="special_hours">Horário Especial de Funcionamento</option>
        </select>

        {blockType === 'block' && (
          <div className="space-y-3">
            <input type="date" required value={blockDate} onChange={(e) => setBlockDate(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
            <div className="grid grid-cols-2 gap-2">
              <input type="time" required value={blockStartTime} onChange={(e) => setBlockStartTime(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
              <input type="time" required value={blockEndTime} onChange={(e) => setBlockEndTime(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
            </div>
          </div>
        )}

        {blockType === 'vacation' && (
          <div className="space-y-3">
            <div className="flex gap-2 mb-2 text-slate-500 font-medium">
              <label>
                <input
                  type="radio"
                  name="v_type"
                  checked={vacationMode === 'single'}
                  onChange={() => { setVacationMode('single'); setBlockStartDate(''); setBlockEndDate(''); }}
                /> Um dia
              </label>
              <label>
                <input
                  type="radio"
                  name="v_type"
                  checked={vacationMode === 'range'}
                  onChange={() => { setVacationMode('range'); setBlockDate(''); }}
                /> Período
              </label>
            </div>
            {vacationMode === 'single' ? (
               <input type="date" required value={blockDate} onChange={(e) => setBlockDate(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <input type="date" required value={blockStartDate} onChange={(e) => setBlockStartDate(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
                <input type="date" required value={blockEndDate} onChange={(e) => setBlockEndDate(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
              </div>
            )}
          </div>
        )}

        {blockType === 'special' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <input type="date" required value={blockStartDate} onChange={(e) => setBlockStartDate(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
              <input type="date" required value={blockEndDate} onChange={(e) => setBlockEndDate(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
            </div>
          </div>
        )}

        {blockType === 'special_hours' && (
           <div className="space-y-3">
             <input type="date" required value={blockDate} onChange={(e) => setBlockDate(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
             <div className="grid grid-cols-2 gap-2">
               <div>
                 <label className="text-[10px] uppercase font-bold text-slate-500">Abertura</label>
                 <input type="time" required value={specialOpen} onChange={(e) => setSpecialOpen(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
               </div>
               <div>
                 <label className="text-[10px] uppercase font-bold text-slate-500">Fechamento</label>
                 <input type="time" required value={specialClose} onChange={(e) => setSpecialClose(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
               </div>
             </div>
             <label className="flex items-center gap-2 font-bold text-slate-700">
               <input type="checkbox" checked={useSpecialBreak} onChange={(e) => setUseSpecialBreak(e.target.checked)} />
               Adicionar Pausa/Almoço
             </label>
             {useSpecialBreak && (
               <div className="grid grid-cols-2 gap-2">
                 <input type="time" required value={specialBreakStart} onChange={(e) => setSpecialBreakStart(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
                 <input type="time" required value={specialBreakEnd} onChange={(e) => setSpecialBreakEnd(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
               </div>
             )}
           </div>
        )}

        <input type="text" required maxLength={200} value={blockReason} onChange={(e) => setBlockReason(e.target.value)} placeholder="Motivo (Ex: Férias, Médico...)" className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
        
        <button type="submit" disabled={isSaving} className="w-full bg-slate-900 text-white py-2 rounded-lg font-bold hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 transition-colors">
          {isSaving ? 'Salvando...' : 'Salvar Bloqueio'}
        </button>
      </form>

      <div className="mt-4 pt-4 border-t border-slate-100">
        <h4 className="font-bold text-slate-900 text-sm mb-3">Bloqueios Ativos ({scheduleBlocks.length})</h4>
        <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
          {scheduleBlocks.length === 0 ? (
            <p className="text-xs text-slate-500">Nenhum bloqueio cadastrado.</p>
          ) : (
            scheduleBlocks.map(sb => (
              <div key={sb.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100 relative group text-xs">
                <div className="font-bold text-slate-800 mb-1 pr-7">{sb.reason}</div>
                <div className="text-slate-500 font-medium">
                  {sb.professionalId === 'all' ? 'Todos os profissionais' : professionals.find(b=>b.id===sb.professionalId)?.name}
                </div>
                <div className="text-slate-600 mt-1">
                  {sb.type === 'block' && `${new Date(sb.date! + "T12:00:00").toLocaleDateString("pt-BR", {day: "2-digit", month: "2-digit"})} ${sb.startTime}-${sb.endTime}`}
                  {sb.type === 'vacation' && (sb.date ? new Date(sb.date + "T12:00:00").toLocaleDateString("pt-BR", {day: "2-digit", month: "2-digit"}) : `${new Date(sb.startDate! + "T12:00:00").toLocaleDateString("pt-BR", {day: "2-digit", month: "2-digit"})} a ${new Date(sb.endDate! + "T12:00:00").toLocaleDateString("pt-BR", {day: "2-digit", month: "2-digit"})}`)}
                  {sb.type === 'special' && (
                    sb.specialHours
                      ? `${new Date(sb.date! + "T12:00:00").toLocaleDateString("pt-BR", {day: "2-digit", month: "2-digit"})} · Horário especial ${sb.specialHours.open}-${sb.specialHours.close}`
                      : (sb.date
                          ? new Date(sb.date + "T12:00:00").toLocaleDateString("pt-BR", {day: "2-digit", month: "2-digit"})
                          : `${new Date(sb.startDate! + "T12:00:00").toLocaleDateString("pt-BR", {day: "2-digit", month: "2-digit"})} a ${new Date(sb.endDate! + "T12:00:00").toLocaleDateString("pt-BR", {day: "2-digit", month: "2-digit"})}`)
                  )}
                </div>
                <button
                  type="button"
                  aria-label={`Remover bloqueio ${sb.reason}`}
                  disabled={deletingId === sb.id}
                  onClick={() => handleDeleteScheduleBlock(sb.id)}
                  className="absolute top-2 right-2 p-1 text-rose-500 bg-rose-50 rounded-md disabled:cursor-not-allowed disabled:opacity-40 transition-opacity"
                >
                  <Ban size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};
