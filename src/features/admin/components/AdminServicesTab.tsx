import React, { useMemo, useState } from 'react';
import { Plus, Edit2, PowerOff } from 'lucide-react';
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
  const { services, deactivateService } = useApp();

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

  const handleDeactivateService = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja desativar o serviço "${name}"? O histórico será preservado.`)) {
      try {
        await deactivateService(id);
        setSuccessMessage('Serviço desativado com sucesso!');
      } catch (err) {
        setErrorMessage(getErrorMessage(err, 'Erro ao desativar serviço.'));
      }
    }
  };

  const catalog = useMemo(() => {
    const sorted = [...services].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const grouped = new Map<string, { label: string; services: Service[] }>();

    sorted.forEach(service => {
      const category = service.category?.trim();
      if (!category) return;
      const key = category.toLocaleLowerCase('pt-BR');
      const current = grouped.get(key) ?? { label: category, services: [] };
      current.services.push(service);
      grouped.set(key, current);
    });

    // Uma categoria só ganha bloco visual quando realmente agrupa serviços.
    // Categorias com um único item repetem informação e alongam a tela.
    const categoryGroups = [...grouped.values()].filter(group => group.services.length >= 2);
    const groupedIds = new Set(categoryGroups.flatMap(group => group.services.map(service => service.id)));
    const standaloneServices = sorted.filter(service => !groupedIds.has(service.id));

    return { sorted, categoryGroups, standaloneServices };
  }, [services]);

  const renderServiceCard = (service: Service, showCategory = false) => (
    <div key={service.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:border-slate-300 transition-colors group flex flex-col h-full">
      <div className="flex justify-between items-start mb-2">
        <div className="min-w-0">
          <h4 className="font-extrabold text-slate-900 text-lg leading-tight">{service.name}</h4>
          {showCategory && service.category?.trim() && (
            <p className="mt-1 text-[11px] font-semibold text-slate-400">{service.category.trim()}</p>
          )}
        </div>
        <div className="flex items-center gap-1 transition-opacity">
          <button
            onClick={() => handleEditService(service)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Editar"
            aria-label={`Editar ${service.name}`}
          >
            <Edit2 size={16} />
          </button>
          {service.active !== false && (
            <button
              onClick={() => handleDeactivateService(service.id, service.name)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Desativar"
              aria-label={`Desativar ${service.name}`}
            >
              <PowerOff size={16} />
            </button>
          )}
        </div>
      </div>

      {service.description && (
        <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">
          {service.description}
        </p>
      )}

      <div className="flex items-end justify-between pt-4 border-t border-slate-100 mt-auto">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Valor e tempo</p>
          <div className="flex items-baseline gap-2">
            <span className="font-black text-slate-900 text-xl tracking-tight">
              {service.price === 0 ? 'Grátis' : formatBRL(service.price)}
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
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Serviços</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Cadastre somente o que este estabelecimento oferece. Categorias são opcionais e servem apenas para organizar serviços relacionados.
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
          {catalog.categoryGroups.map(group => (
            <section key={group.label} className="space-y-4">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-lg font-extrabold text-slate-900">{group.label}</h3>
                <p className="mt-0.5 text-xs text-slate-400">{group.services.length} serviços nesta categoria</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.services.map(service => renderServiceCard(service))}
              </div>
            </section>
          ))}

          {catalog.standaloneServices.length > 0 && (
            <section className="space-y-4">
              {catalog.categoryGroups.length > 0 && (
                <h3 className="text-sm font-bold text-slate-500">Outros serviços</h3>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {catalog.standaloneServices.map(service => renderServiceCard(service))}
              </div>
            </section>
          )}

          {catalog.sorted.length === 0 && (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300">
              <p className="text-slate-500 font-medium">Nenhum serviço cadastrado ainda.</p>
              <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400">O CORE não presume o catálogo do estabelecimento. Cadastre apenas os serviços realmente oferecidos.</p>
              <button
                onClick={() => setShowServiceForm(true)}
                className="mt-4 text-slate-900 font-bold hover:text-slate-700"
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
