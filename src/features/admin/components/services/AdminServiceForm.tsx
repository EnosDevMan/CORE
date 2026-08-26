import React, { useMemo, useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../../../store/useApp';
import { Service } from '../../../../types';
import { getErrorMessage } from '../../../../utils/errors';
import { parseBRNumber } from '../../../../utils/validation';

interface AdminServiceFormProps {
  editingService: Service | null;
  onClose: () => void;
  setSuccessMessage: (msg: string) => void;
  setErrorMessage: (msg: string) => void;
}

export const AdminServiceForm: React.FC<AdminServiceFormProps> = ({
  editingService,
  onClose,
  setSuccessMessage,
  setErrorMessage,
}) => {
  const { addService, updateService, services } = useApp();

  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceDuration, setServiceDuration] = useState('');
  const [serviceCategory, setServiceCategory] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceActive, setServiceActive] = useState(true);
  const [serviceOrder, setServiceOrder] = useState('0');
  const [isSaving, setIsSaving] = useState(false);

  const categorySuggestions = useMemo(() => {
    const unique = new Map<string, string>();
    services.forEach(service => {
      const category = service.category?.trim();
      if (category) unique.set(category.toLocaleLowerCase('pt-BR'), category);
    });
    return [...unique.values()].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [services]);

  useEffect(() => {
    if (editingService) {
      setServiceName(editingService.name);
      setServicePrice(editingService.price.toString());
      setServiceDuration(editingService.duration.toString());
      setServiceCategory(editingService.category || '');
      setServiceDescription(editingService.description || '');
      setServiceActive(editingService.active !== false);
      setServiceOrder((editingService.order || 0).toString());
    }
  }, [editingService]);

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedName = serviceName.trim();
    if (normalizedName.length < 2 || normalizedName.length > 100) {
      setErrorMessage('O nome do serviço deve ter entre 2 e 100 caracteres.');
      return;
    }
    const parsedPrice = parseBRNumber(servicePrice);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0 || parsedPrice > 99_999_999.99) {
      setErrorMessage('Informe um preço válido (ex: 45,90).');
      return;
    }
    const parsedDuration = Number(serviceDuration);
    if (!Number.isInteger(parsedDuration) || parsedDuration < 5 || parsedDuration > 480) {
      setErrorMessage('A duração deve ser um número inteiro entre 5 e 480 minutos.');
      return;
    }
    if (serviceDescription.length > 1000) {
      setErrorMessage('A descrição deve ter no máximo 1000 caracteres.');
      return;
    }
    const normalizedCategory = serviceCategory.trim();
    if (normalizedCategory.length > 100) {
      setErrorMessage('A categoria deve ter no máximo 100 caracteres.');
      return;
    }
    const parsedOrder = Number(serviceOrder);
    if (!Number.isInteger(parsedOrder) || parsedOrder < -2_147_483_648 || parsedOrder > 2_147_483_647) {
      setErrorMessage('A ordem de exibição deve ser um número inteiro válido.');
      return;
    }
    setIsSaving(true);
    try {
      const sData: Omit<Service, 'id'> = {
        name: normalizedName,
        price: parsedPrice,
        duration: parsedDuration,
        category: normalizedCategory,
        description: serviceDescription.trim(),
        active: serviceActive,
        order: parsedOrder
      };

      if (editingService) {
        await updateService({ ...sData, id: editingService.id } as Service);
        setSuccessMessage('Serviço atualizado com sucesso!');
      } else {
        await addService(sData);
        setSuccessMessage('Serviço adicionado com sucesso!');
      }
      onClose();
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Erro ao salvar serviço.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 animate-in slide-in-from-top-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-extrabold text-slate-900">
          {editingService ? 'Editar Serviço' : 'Cadastrar Novo Serviço'}
        </h3>
        <button
          type="button"
          onClick={onClose}
          disabled={isSaving}
          aria-label="Fechar formulário de serviço"
          className="p-2 text-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleServiceSubmit} className="space-y-6" noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nome do Serviço *</label>
            <input
              type="text" required minLength={2} maxLength={100} value={serviceName} onChange={(e) => setServiceName(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-medium"
              placeholder="Ex: Alongamento em gel"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Categoria <span className="font-medium normal-case tracking-normal text-slate-400">(opcional)</span></label>
            <input
              type="text"
              list="service-category-options"
              maxLength={100}
              value={serviceCategory}
              onChange={(e) => setServiceCategory(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 bg-white font-medium"
              placeholder="Ex: Alongamentos"
            />
            <datalist id="service-category-options">
              {categorySuggestions.map(category => <option key={category} value={category} />)}
            </datalist>
            <p className="text-xs leading-5 text-slate-400">Use apenas quando ajudar a organizar vários serviços. Você pode escolher uma categoria já usada ou criar outra.</p>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Preço (R$) *</label>
            <input
              type="text" inputMode="decimal" maxLength={16} required value={servicePrice} onChange={(e) => setServicePrice(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-medium"
              placeholder="45,00"
            />
            <p className="text-xs leading-5 text-slate-400">Use 0,00 somente quando o serviço for realmente gratuito.</p>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Duração (Minutos) *</label>
            <input
              type="number" step="5" min="5" max="480" required value={serviceDuration} onChange={(e) => setServiceDuration(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-medium"
              placeholder="30"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Descrição Curta (Opcional)</label>
            <textarea
              value={serviceDescription} onChange={(e) => setServiceDescription(e.target.value)}
              maxLength={1000}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 resize-none font-medium text-sm"
              rows={2} placeholder="Descreva os detalhes do serviço..."
            ></textarea>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Ordem de Exibição</label>
            <input
              type="number" value={serviceOrder} onChange={(e) => setServiceOrder(e.target.value)}
              step="1"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-medium"
              placeholder="0"
            />
          </div>
          <div className="space-y-2 flex items-center pt-8">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={serviceActive}
                  onChange={(e) => setServiceActive(e.target.checked)}
                />
                <div className={`block w-12 h-6 rounded-full transition-colors ${serviceActive ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${serviceActive ? 'translate-x-6' : ''}`}></div>
              </div>
              <span className="text-sm font-bold text-slate-700">Serviço Ativo</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-slate-100">
          <div className="flex gap-3">
            <button
              type="button" onClick={onClose} disabled={isSaving}
              className="px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-md transition-all active:scale-[0.98]"
            >
              {isSaving ? 'Salvando...' : editingService ? 'Salvar Alterações' : 'Cadastrar Serviço'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
