import React, { useState } from 'react';
import { X, User, Camera, Loader2, Check } from 'lucide-react';
import { Barber } from '../../../types';
import { uploadImage } from '../../../services/storageService';
import { getErrorMessage } from '../../../utils/errors';

interface BarberProfileEditModalProps {
  barber: Barber;
  onClose: () => void;
  onSave: (barber: Barber) => Promise<void>;
  setSuccessMessage: (msg: string) => void;
  setErrorMessage: (msg: string) => void;
}

/**
 * Autoedição de perfil do barbeiro: nome, especialidade, descrição e foto.
 * Campos administrativos (ativo/inativo, chave PIX, horário, ordem de
 * exibição, vínculo com usuário) continuam só no painel Admin —
 * inclusive protegidos no banco pela trigger `protect_barber_updates`
 * (ver supabase/schema.sql), então mesmo chamando `updateBarber` com o
 * objeto completo do barbeiro, só estes 4 campos realmente são gravados.
 */
export const BarberProfileEditModal: React.FC<BarberProfileEditModalProps> = ({
  barber,
  onClose,
  onSave,
  setSuccessMessage,
  setErrorMessage,
}) => {
  const [name, setName] = useState(barber.name);
  const [specialty, setSpecialty] = useState(barber.specialty || '');
  const [description, setDescription] = useState(barber.description || '');
  const [avatar, setAvatar] = useState(barber.avatar || '');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `barbers/${barber.id}-${Date.now()}.${ext}`;
      const url = await uploadImage(file, path);
      setAvatar(url);
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Não foi possível enviar a foto.'));
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Informe seu nome.');
      return;
    }
    setIsSaving(true);
    try {
      await onSave({ ...barber, name, specialty, description, avatar });
      setSuccessMessage('Perfil atualizado com sucesso!');
      onClose();
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Não foi possível salvar seu perfil.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl shadow-xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b border-slate-100">
          <h3 className="text-lg font-extrabold text-slate-900">Meu Perfil</h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5" noValidate>
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
              {avatar ? (
                <img src={avatar} alt="Sua foto" className="w-full h-full object-cover" />
              ) : (
                <User size={32} className="text-slate-300" />
              )}
            </div>
            <label
              htmlFor="my-profile-photo-upload"
              className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-slate-300 rounded-xl text-sm font-semibold text-slate-600 active:bg-slate-50 cursor-pointer transition-colors"
            >
              {isUploadingPhoto ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Enviando...
                </>
              ) : (
                <>
                  <Camera size={16} /> {avatar ? 'Trocar foto' : 'Enviar foto'}
                </>
              )}
              <input
                id="my-profile-photo-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                disabled={isUploadingPhoto}
                className="hidden"
              />
            </label>
            <p className="text-[10px] text-slate-500">JPG, PNG ou WEBP, até 5MB.</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nome</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Especialidade</label>
            <input
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="Ex: Especialista em Degradê"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Descrição Curta</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Fale um pouco sobre você..."
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none font-medium text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isUploadingPhoto || isSaving}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold text-sm shadow-md transition-all active:scale-[0.98] flex items-center gap-2"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
