import React, { useState } from 'react';
import { Plus, Edit2, Trash2, User } from 'lucide-react';
import type { Professional } from '../../professionals/types';
import { useProfessionalAdmin } from '../../professionals/hooks/useProfessionalAdmin';
import { AdminProfessionalForm } from './professionals/AdminProfessionalForm';
import { getErrorMessage } from '../../../utils/errors';
import { DEFAULT_PROFESSIONAL_AVATAR } from '../../professionals/constants';
import { useNiche } from '../../../core/business/hooks';

interface AdminProfessionalsTabProps {
  setSuccessMessage: (msg: string) => void;
  setErrorMessage: (msg: string) => void;
}

export const AdminProfessionalsTab: React.FC<AdminProfessionalsTabProps> = ({
  setSuccessMessage,
  setErrorMessage,
}) => {
  const { professionals, users, deleteProfessional } = useProfessionalAdmin();
  const niche = useNiche();

  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [showProfessionalForm, setShowProfessionalForm] = useState(false);

  const resetProfessionalForm = () => {
    setEditingProfessional(null);
    setShowProfessionalForm(false);
  };

  const handleEditProfessional = (professional: Professional) => {
    setEditingProfessional(professional);
    setShowProfessionalForm(true);
  };

  const handleDeleteProfessional = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o(a) profissional ${name}?`)) {
      try {
        await deleteProfessional(id);
        setSuccessMessage('Profissional removido com sucesso!');
      } catch (err) {
        setErrorMessage(getErrorMessage(err, 'Erro ao remover profissional.'));
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">{niche.professionalLabel}</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Gerencie a equipe e seus horários de atendimento
          </p>
        </div>
        {!showProfessionalForm && (
          <button
            onClick={() => {
              setEditingProfessional(null);
              setShowProfessionalForm(true);
            }}
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            <Plus size={18} /> Novo Profissional
          </button>
        )}
      </div>

      {showProfessionalForm && (
        <AdminProfessionalForm
          editingProfessional={editingProfessional}
          onClose={resetProfessionalForm}
          setSuccessMessage={setSuccessMessage}
          setErrorMessage={setErrorMessage}
        />
      )}

      {!showProfessionalForm && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...professionals].sort((a, b) => (a.order || 0) - (b.order || 0)).map((professional) => {
            const linkedUser = professional.userId ? users.find(u => u.id === professional.userId) : null;
            
            return (
              <div key={professional.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow group flex flex-col h-full">
                <div className="flex items-start gap-4 mb-4">
                  <img
                    src={professional.avatar || DEFAULT_PROFESSIONAL_AVATAR}
                    alt={professional.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-slate-100 shadow-sm"
                    onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_PROFESSIONAL_AVATAR; }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-slate-900 text-lg truncate leading-tight mb-1 flex items-center gap-2">
                      {professional.name}
                      {professional.active === false && (
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md shrink-0">Inativo</span>
                      )}
                    </h3>
                    <p className="text-xs font-bold text-indigo-600 bg-indigo-50 inline-block px-2 py-0.5 rounded-md truncate max-w-full">
                      {professional.specialty || 'Profissional'}
                    </p>
                  </div>
                </div>

                <div className="flex-1 space-y-3 mb-6">
                  {professional.description && (
                    <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                      {professional.description}
                    </p>
                  )}
                  
                  {linkedUser && (
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <User size={12} className="text-slate-400" />
                      <span className="truncate">Vinculado a: {linkedUser.email}</span>
                    </div>
                  )}

                  {professional.workingHours ? (
                    <div className="bg-amber-50 rounded-xl p-3 border border-amber-100/50">
                      <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        Horário Personalizado
                      </p>
                      <p className="text-xs font-semibold text-amber-900 flex justify-between">
                        <span>{professional.workingHours.open} às {professional.workingHours.close}</span>
                        <span>{professional.workingHours.daysOpen.length} dias/semana</span>
                      </p>
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Horário Padrão da Loja
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-slate-100 mt-auto">
                  <button
                    onClick={() => handleEditProfessional(professional)}
                    className="flex-1 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Edit2 size={14} /> Editar
                  </button>
                  <button
                    onClick={() => handleDeleteProfessional(professional.id, professional.name)}
                    className="flex-1 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={14} /> Excluir
                  </button>
                </div>
              </div>
            );
          })}
          
          <button
            onClick={() => {
              setEditingProfessional(null);
              setShowProfessionalForm(true);
            }}
            className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 hover:bg-slate-100 hover:border-slate-300 transition-all flex flex-col items-center justify-center text-slate-500 hover:text-slate-700 min-h-[280px] group cursor-pointer"
          >
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
              <Plus size={24} />
            </div>
            <span className="font-bold text-sm">Adicionar Profissional</span>
            <span className="text-xs mt-1 text-slate-400">Expandir equipe</span>
          </button>
        </div>
      )}
    </div>
  );
};
