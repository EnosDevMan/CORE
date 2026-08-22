import React, { useState, useEffect } from 'react';
import { X, User, Camera, Loader2 } from 'lucide-react';
import type { Professional } from '../../../professionals/types';
import { useProfessionalAdmin } from '../../../professionals/hooks/useProfessionalAdmin';
import { uploadImage } from '../../../../services/storageService';
import { getErrorMessage } from '../../../../utils/errors';
import { isProfessionalRole } from '../../../../auth/authorization';

interface AdminProfessionalFormProps {
  editingProfessional: Professional | null;
  onClose: () => void;
  setSuccessMessage: (msg: string) => void;
  setErrorMessage: (msg: string) => void;
}

const WEEK_DAYS = [
  { id: 0, label: 'Dom' },
  { id: 1, label: 'Seg' },
  { id: 2, label: 'Ter' },
  { id: 3, label: 'Qua' },
  { id: 4, label: 'Qui' },
  { id: 5, label: 'Sex' },
  { id: 6, label: 'Sáb' },
];

export const AdminProfessionalForm: React.FC<AdminProfessionalFormProps> = ({
  editingProfessional,
  onClose,
  setSuccessMessage,
  setErrorMessage,
}) => {
  const { users, addProfessional, updateProfessional } = useProfessionalAdmin();

  const [professionalName, setProfessionalName] = useState('');
  const [professionalAvatar, setProfessionalAvatar] = useState('');
  const [professionalSpecialty, setProfessionalSpecialty] = useState('');
  const [professionalDescription, setProfessionalDescription] = useState('');
  const [professionalOrder, setProfessionalOrder] = useState('0');
  const [professionalUserId, setProfessionalUserId] = useState('');
  const [professionalActive, setProfessionalActive] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [useCustomSchedule, setUseCustomSchedule] = useState(false);
  const [professionalOpenTime, setProfessionalOpenTime] = useState('08:00');
  const [professionalCloseTime, setProfessionalCloseTime] = useState('19:00');
  const [professionalDaysOpen, setProfessionalDaysOpen] = useState<number[]>([2, 3, 4, 5, 6]);
  const [professionalHasBreak, setProfessionalHasBreak] = useState(false);
  const [professionalBreakStart, setProfessionalBreakStart] = useState('12:00');
  const [professionalBreakEnd, setProfessionalBreakEnd] = useState('13:00');

  useEffect(() => {
    if (editingProfessional) {
      setProfessionalName(editingProfessional.name);
      setProfessionalAvatar(editingProfessional.avatar || '');
      setProfessionalSpecialty(editingProfessional.specialty || '');
      setProfessionalDescription(editingProfessional.description || '');
      setProfessionalOrder((editingProfessional.order || 0).toString());
      setProfessionalUserId(editingProfessional.userId || '');
      setProfessionalActive(editingProfessional.active !== false);

      if (editingProfessional.workingHours) {
        setUseCustomSchedule(true);
        setProfessionalOpenTime(editingProfessional.workingHours.open);
        setProfessionalCloseTime(editingProfessional.workingHours.close);
        setProfessionalDaysOpen(editingProfessional.workingHours.daysOpen);
        if (editingProfessional.workingHours.breakStart && editingProfessional.workingHours.breakEnd) {
          setProfessionalHasBreak(true);
          setProfessionalBreakStart(editingProfessional.workingHours.breakStart);
          setProfessionalBreakEnd(editingProfessional.workingHours.breakEnd);
        } else {
          setProfessionalHasBreak(false);
        }
      } else {
        setUseCustomSchedule(false);
      }
    }
  }, [editingProfessional]);

  const toggleProfessionalDay = (day: number) => {
    if (professionalDaysOpen.includes(day)) {
      setProfessionalDaysOpen(professionalDaysOpen.filter(d => d !== day));
    } else {
      setProfessionalDaysOpen([...professionalDaysOpen, day].sort());
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `professionals/${editingProfessional?.id || crypto.randomUUID()}-${Date.now()}.${ext}`;
      const url = await uploadImage(file, path);
      setProfessionalAvatar(url);
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Não foi possível enviar a foto.'));
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleProfessionalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!professionalName.trim()) {
      setErrorMessage('Informe o nome do profissional.');
      return;
    }
    try {
      const professionalData: Omit<Professional, 'id'> = {
        name: professionalName,
        avatar: professionalAvatar || '/favicon.svg',
        specialty: professionalSpecialty,
        active: professionalActive,
        description: professionalDescription,
        order: Number(professionalOrder),
        userId: professionalUserId || undefined,
        workingHours: useCustomSchedule ? {
          open: professionalOpenTime,
          close: professionalCloseTime,
          daysOpen: professionalDaysOpen,
          breakStart: professionalHasBreak ? professionalBreakStart : undefined,
          breakEnd: professionalHasBreak ? professionalBreakEnd : undefined
        } : undefined
      };

      if (editingProfessional) {
        await updateProfessional({ ...professionalData, id: editingProfessional.id });
        setSuccessMessage('Profissional atualizado com sucesso!');
      } else {
        await addProfessional(professionalData);
        setSuccessMessage('Profissional adicionado com sucesso!');
      }
      onClose();
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Erro ao salvar profissional.'));
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 animate-in slide-in-from-top-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-extrabold text-slate-900">
          {editingProfessional ? 'Editar Profissional' : 'Cadastrar Novo Profissional'}
        </h3>
        <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleProfessionalSubmit} className="space-y-6" noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nome Completo *</label>
            <input
              type="text" required value={professionalName} onChange={(e) => setProfessionalName(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-medium"
              placeholder="Ex: João Silva"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Especialidade</label>
            <input
              type="text" value={professionalSpecialty} onChange={(e) => setProfessionalSpecialty(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-medium"
              placeholder="Ex: Especialista em Degradê"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Foto do Profissional</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                {professionalAvatar ? (
                  <img src={professionalAvatar} alt="Prévia da foto" className="w-full h-full object-cover" />
                ) : (
                  <User size={24} className="text-slate-300" />
                )}
              </div>
              <label
                htmlFor="professional-photo-upload"
                className="flex-1 h-12 flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-xl text-sm font-semibold text-slate-600 active:bg-slate-50 cursor-pointer transition-colors"
              >
                {isUploadingPhoto ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Enviando...
                  </>
                ) : (
                  <>
                    <Camera size={16} /> {professionalAvatar ? 'Trocar foto' : 'Enviar foto'}
                  </>
                )}
                <input
                  id="professional-photo-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  disabled={isUploadingPhoto}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-[10px] text-slate-500">JPG, PNG ou WEBP, até 5MB. Se não enviar, geramos um avatar automático.</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Ordem de Exibição</label>
            <input
              type="number" value={professionalOrder} onChange={(e) => setProfessionalOrder(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-medium"
              placeholder="0"
            />
            <p className="text-[10px] text-slate-500">Menores valores aparecem primeiro</p>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <User size={14} /> Vincular a um Usuário do Sistema
            </label>
            <select
              value={professionalUserId}
              onChange={(e) => setProfessionalUserId(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-medium bg-white"
            >
              <option value="">Não vincular (Apenas perfil)</option>
              {users
                .filter(u => isProfessionalRole(u.role) && (!u.profileId || u.profileId === editingProfessional?.id))
                .map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
            </select>
            <p className="text-[10px] text-slate-500">Permite que o profissional acesse o painel 'Minha Agenda'</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="professionalActive"
            checked={professionalActive}
            onChange={(e) => setProfessionalActive(e.target.checked)}
            className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
          />
          <label htmlFor="professionalActive" className="font-bold text-slate-800 text-sm cursor-pointer">
            Profissional ativo (visível para novos agendamentos)
          </label>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Descrição Curta (Opcional)</label>
          <textarea
            value={professionalDescription} onChange={(e) => setProfessionalDescription(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 resize-none font-medium text-sm"
            rows={2} placeholder="Fale um pouco sobre o profissional..."
          ></textarea>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              id="useCustomSchedule"
              checked={useCustomSchedule}
              onChange={(e) => setUseCustomSchedule(e.target.checked)}
              className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
            />
            <label htmlFor="useCustomSchedule" className="font-bold text-slate-800 text-sm cursor-pointer">
              Usar horário de atendimento personalizado
            </label>
          </div>

          {useCustomSchedule && (
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-5 animate-in fade-in">
              <div className="grid grid-cols-2 gap-4 max-w-sm">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Início</label>
                  <input
                    type="time" value={professionalOpenTime} onChange={(e) => setProfessionalOpenTime(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Fim</label>
                  <input
                    type="time" value={professionalCloseTime} onChange={(e) => setProfessionalCloseTime(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Dias de Trabalho</label>
                <div className="flex flex-wrap gap-2">
                  {WEEK_DAYS.map(day => (
                    <button
                      key={day.id} type="button" onClick={() => toggleProfessionalDay(day.id)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        professionalDaysOpen.includes(day.id)
                          ? 'bg-slate-900 text-white shadow-md'
                          : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox" id="professionalHasBreak" checked={professionalHasBreak}
                    onChange={(e) => setProfessionalHasBreak(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                  />
                  <label htmlFor="professionalHasBreak" className="text-sm font-semibold text-slate-700 cursor-pointer">
                    Adicionar intervalo (almoço/descanso)
                  </label>
                </div>

                {professionalHasBreak && (
                  <div className="grid grid-cols-2 gap-4 max-w-sm ml-6 border-l-2 border-slate-200 pl-4 py-1">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Início do Intervalo</label>
                      <input
                        type="time" value={professionalBreakStart} onChange={(e) => setProfessionalBreakStart(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Fim do Intervalo</label>
                      <input
                        type="time" value={professionalBreakEnd} onChange={(e) => setProfessionalBreakEnd(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <div className="flex gap-3">
            <button
              type="button" onClick={onClose}
              className="px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isUploadingPhoto}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold text-sm shadow-md transition-all active:scale-[0.98]"
            >
              {editingProfessional ? 'Salvar Alterações' : 'Cadastrar Profissional'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
