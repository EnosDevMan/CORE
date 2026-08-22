import React, { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useApp } from '../../../store/useApp';
import { Service } from '../../../types';
import { AdminServiceForm } from './services/AdminServiceForm';
import { getErrorMessage } from '../../../utils/errors';

interface AdminServicesTabProps {
  formatBRL: (value: number) => string;
  setSuccessMessage: (msg: string) => void;
  setErrorMessage: (msg: string) => void;
}

export const AdminServicesTab: React.FC<AdminServicesTabProps> = ({
  formatBRL,
  setSuccessMessage,
  setErrorMessage,
}) => {
  const { services, deleteService } = useApp();

  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showServiceForm, setShowServiceForm] = useState(false);

  const resetServiceForm = () => {
    setEditingService(null);
    setShowServiceForm(false);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setShowServiceForm(true);
  };

  const handleDeleteService = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o serviço "${name}"?`)) {
      try {
        await deleteService(id);
        setSuccessMessage('Serviço removido com sucesso!');
      } catch (err) {
        setErrorMessage(getErrorMessage(err, 'Erro ao remover serviço.'));
      }
    }
  };

  // Group services by category
  const categories = Array.from(new Set(services.map(s => s.category || 'Outros')));
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Catálogo de Serviços</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Cadastre os serviços oferecidos e seus valores
          </p>
        </div>
        {!showServiceForm && (
          <button
            onClick={() => {
              setEditingService(null);
              setShowServiceForm(true);
            }}
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            <Plus size={18} /> Novo Serviço
          </button>
        )}
      </div>

      {showServiceForm && (
        <AdminServiceForm
          editingService={editingService}
          onClose={resetServiceForm}
          setSuccessMessage={setSuccessMessage}
          setErrorMessage={setErrorMessage}
        />
      )}

      {!showServiceForm && (
        <div className="space-y-8">
          {categories.map(category => (
            <div key={category} className="space-y-4">
              <h3 className="text-lg font-extrabold text-slate-900 border-b border-slate-200 pb-2">{category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services
                  .filter(s => (s.category || 'Outros') === category)
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((service) => (
                    <div key={service.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:border-indigo-200 transition-colors group flex flex-col h-full">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-extrabold text-slate-900 text-lg leading-tight">{service.name}</h4>
                        <div className="flex items-center gap-1 transition-opacity">
                          <button
                            onClick={() => handleEditService(service)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteService(service.id, service.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      {service.description && (
                        <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">
                          {service.description}
                        </p>
                      )}
                      
                      <div className="flex items-end justify-between pt-4 border-t border-slate-100 mt-auto">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Valor e Tempo</p>
                          <div className="flex items-baseline gap-2">
                            <span className="font-black text-indigo-600 text-xl tracking-tight">
                              {formatBRL(service.price)}
                            </span>
                            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              {service.duration} min
                            </span>
                          </div>
                        </div>
                        
                        {!service.active && (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-1 rounded-md uppercase tracking-wider">
                            Inativo
                          </span>
                        )}
                      </div>
                    </div>
                ))}
              </div>
            </div>
          ))}
          
          {services.length === 0 && (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300">
              <p className="text-slate-500 font-medium">Nenhum serviço cadastrado ainda.</p>
              <button
                onClick={() => setShowServiceForm(true)}
                className="mt-4 text-indigo-600 font-bold hover:text-indigo-700"
              >
                Cadastrar o primeiro serviço
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
