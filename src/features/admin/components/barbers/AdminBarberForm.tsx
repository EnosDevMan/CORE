import React, { useState, useEffect } from 'react';
import { X, User, Camera, Loader2 } from 'lucide-react';
import { useApp } from '../../../../store/useApp';
import { Barber } from '../../../../types';
import { uploadImage } from '../../../../services/storageService';
import { getErrorMessage } from '../../../../utils/errors';

interface AdminBarberFormProps {
  editingBarber: Barber | null;
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

export const AdminBarberForm: React.FC<AdminBarberFormProps> = ({
  editingBarber,
  onClose,
  setSuccessMessage,
  setErrorMessage,
}) => {
  const { users, addBarber, updateBarber } = useApp();

  const [barberName, setBarberName] = useState('');
  const [barberAvatar, setBarberAvatar] = useState('');
  const [barberSpecialty, setBarberSpecialty] = useState('');
  const [barberDescription, setBarberDescription] = useState('');
  const [barberOrder, setBarberOrder] = useState('0');
  const [barberUserId, setBarberUserId] = useState('');
  const [barberActive, setBarberActive] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [useCustomSchedule, setUseCustomSchedule] = useState(false);
  const [barberOpenTime, setBarberOpenTime] = useState('08:00');
  const [barberCloseTime, setBarberCloseTime] = useState('19:00');
  const [barberDaysOpen, setBarberDaysOpen] = useState<number[]>([2, 3, 4, 5, 6]);
  const [barberHasBreak, setBarberHasBreak] = useState(false);
  const [barberBreakStart, setBarberBreakStart] = useState('12:00');
  const [barberBreakEnd, setBarberBreakEnd] = useState('13:00');

  useEffect(() => {
    if (editingBarber) {
      setBarberName(editingBarber.name);
      setBarberAvatar(editingBarber.avatar || '');
      setBarberSpecialty(editingBarber.specialty || '');
      setBarberDescription(editingBarber.description || '');
      setBarberOrder((editingBarber.order || 0).toString());
      setBarberUserId(editingBarber.userId || '');
      setBarberActive(editingBarber.active !== false);

      if (editingBarber.workingHours) {
        setUseCustomSchedule(true);
        setBarberOpenTime(editingBarber.workingHours.open);
        setBarberCloseTime(editingBarber.workingHours.close);
        setBarberDaysOpen(editingBarber.workingHours.daysOpen);
        if (editingBarber.workingHours.breakStart && editingBarber.workingHours.breakEnd) {
          setBarberHasBreak(true);
          setBarberBreakStart(editingBarber.workingHours.breakStart);
          setBarberBreakEnd(editingBarber.workingHours.breakEnd);
        } else {
          setBarberHasBreak(false);
        }
      } else {
        setUseCustomSchedule(false);
      }
    }
  }, [editingBarber]);

  const toggleBarberDay = (day: number) => {
    if (barberDaysOpen.includes(day)) {
      setBarberDaysOpen(barberDaysOpen.filter(d => d !== day));
    } else {
      setBarberDaysOpen([...barberDaysOpen, day].sort());
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `barbers/${editingBarber?.id || crypto.randomUUID()}-${Date.now()}.${ext}`;
      const url = await uploadImage(file, path);
      setBarberAvatar(url);
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Não foi possível enviar a foto.'));
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleBarberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barberName.trim()) {
      setErrorMessage('Informe o nome do profissional.');
      return;
    }
    try {
      const bData: Omit<Barber, 'id'> = {
        name: barberName,
        avatar: barberAvatar || '/favicon.svg',
        specialty: barberSpecialty,
        active: barberActive,
        description: barberDescription,
        order: Number(barberOrder),
        userId: barberUserId || undefined,
        workingHours: useCustomSchedule ? {
          open: barberOpenTime,
          close: barberCloseTime,
          daysOpen: barberDaysOpen,
          breakStart: barberHasBreak ? barberBreakStart : undefined,
          breakEnd: barberHasBreak ? barberBreakEnd : undefined
        } : undefined
      };

      if (editingBarber) {
        await updateBarber({ ...bData, id: editingBarber.id } as Barber);
        setSuccessMessage('Profissional atualizado com sucesso!');
      } else {
        await addBarber(bData);
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
          {editingBarber ? 'Editar Profissional' : 'Cadastrar Novo Profissional'}
        </h3>
        <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>
      
      <form onSubmit={handleBarberSubmit} className="space-y-6" noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nome Completo *</label>
            <input
              type="text" required value={barberName} onChange={(e) => setBarberName(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-medium"
              placeholder="Ex: João Silva"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Especialidade</label>
            <input
              type="text" value={barberSpecialty} onChange={(e) => setBarberSpecialty(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-medium"
              placeholder="Ex: Especialista em Degradê"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Foto do Profissional</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                {barberAvatar ? (
                  <img src={barberAvatar} alt="Prévia da foto" className="w-full h-full object-cover" />
                ) : (
                  <User size={24} className="text-slate-300" />
                )}
              </div>
              <label
                htmlFor="barber-photo-upload"
                className="flex-1 h-12 flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-xl text-sm font-semibold text-slate-600 active:bg-slate-50 cursor-pointer transition-colors"
              >
                {isUploadingPhoto ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Enviando...
                  </>
                ) : (
                  <>
                    <Camera size={16} /> {barberAvatar ? 'Trocar foto' : 'Enviar foto'}
                  </>
                )}
                <input
                  id="barber-photo-upload"
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
              type="number" value={barberOrder} onChange={(e) => setBarberOrder(e.target.value)}
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
              value={barberUserId}
              onChange={(e) => setBarberUserId(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-medium bg-white"
            >
              <option value="">Não vincular (Apenas perfil)</option>
              {users
                .filter(u => u.role === 'barber' && (!u.profileId || u.profileId === editingBarber?.id))
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
            id="barberActive"
            checked={barberActive}
            onChange={(e) => setBarberActive(e.target.checked)}
            className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
          />
          <label htmlFor="barberActive" className="font-bold text-slate-800 text-sm cursor-pointer">
            Profissional ativo (visível para novos agendamentos)
          </label>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Descrição Curta (Opcional)</label>
          <textarea
            value={barberDescription} onChange={(e) => setBarberDescription(e.target.value)}
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
                    type="time" value={barberOpenTime} onChange={(e) => setBarberOpenTime(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Fim</label>
                  <input
                    type="time" value={barberCloseTime} onChange={(e) => setBarberCloseTime(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Dias de Trabalho</label>
                <div className="flex flex-wrap gap-2">
                  {WEEK_DAYS.map(day => (
                    <button
                      key={day.id} type="button" onClick={() => toggleBarberDay(day.id)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        barberDaysOpen.includes(day.id) 
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
                    type="checkbox" id="barberHasBreak" checked={barberHasBreak}
                    onChange={(e) => setBarberHasBreak(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                  />
                  <label htmlFor="barberHasBreak" className="text-sm font-semibold text-slate-700 cursor-pointer">
                    Adicionar intervalo (almoço/descanso)
                  </label>
                </div>
                
                {barberHasBreak && (
                  <div className="grid grid-cols-2 gap-4 max-w-sm ml-6 border-l-2 border-slate-200 pl-4 py-1">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Início do Intervalo</label>
                      <input
                        type="time" value={barberBreakStart} onChange={(e) => setBarberBreakStart(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Fim do Intervalo</label>
                      <input
                        type="time" value={barberBreakEnd} onChange={(e) => setBarberBreakEnd(e.target.value)}
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
              {editingBarber ? 'Salvar Alterações' : 'Cadastrar Profissional'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
