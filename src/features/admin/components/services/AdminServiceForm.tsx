import React, { useState, useEffect } from 'react';
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
  const { addService, updateService } = useApp();

  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceDuration, setServiceDuration] = useState('');
  const [serviceCategory, setServiceCategory] = useState('Cabelo');
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceActive, setServiceActive] = useState(true);
  const [serviceOrder, setServiceOrder] = useState('0');

  useEffect(() => {
    if (editingService) {
      setServiceName(editingService.name);
      setServicePrice(editingService.price.toString());
      setServiceDuration(editingService.duration.toString());
      setServiceCategory(editingService.category || 'Cabelo');
      setServiceDescription(editingService.description || '');
      setServiceActive(editingService.active !== false);
      setServiceOrder((editingService.order || 0).toString());
    }
  }, [editingService]);

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim()) {
      setErrorMessage('Informe o nome do serviço.');
      return;
    }
    const parsedPrice = parseBRNumber(servicePrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setErrorMessage('Informe um preço válido (ex: 45,90).');
      return;
    }
    const parsedDuration = Number(serviceDuration);
    if (isNaN(parsedDuration) || parsedDuration <= 0) {
      setErrorMessage('Informe uma duração válida, em minutos (ex: 30).');
      return;
    }
    try {
      const sData: Omit<Service, 'id'> = {
        name: serviceName,
        price: parsedPrice,
        duration: parsedDuration,
        category: serviceCategory,
        description: serviceDescription,
        active: serviceActive,
        order: Number(serviceOrder) || 0
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
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 animate-in slide-in-from-top-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-extrabold text-slate-900">
          {editingService ? 'Editar Serviço' : 'Cadastrar Novo Serviço'}
        </h3>
        <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>
      
      <form onSubmit={handleServiceSubmit} className="space-y-6" noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nome do Serviço *</label>
            <input
              type="text" required value={serviceName} onChange={(e) => setServiceName(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-medium"
              placeholder="Ex: Corte Degrade"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Categoria *</label>
            <select
              required value={serviceCategory} onChange={(e) => setServiceCategory(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 bg-white font-medium"
            >
              <option value="Cabelo">Cabelo</option>
              <option value="Barba">Barba</option>
              <option value="Combos">Combos</option>
              <option value="Tratamentos">Tratamentos</option>
              <option value="Outros">Outros</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Preço (R$) *</label>
            <input
              type="text" inputMode="decimal" required value={servicePrice} onChange={(e) => setServicePrice(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-medium"
              placeholder="45,00"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Duração (Minutos) *</label>
            <input
              type="number" step="5" min="5" required value={serviceDuration} onChange={(e) => setServiceDuration(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-medium"
              placeholder="30"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Descrição Curta (Opcional)</label>
            <textarea
              value={serviceDescription} onChange={(e) => setServiceDescription(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 resize-none font-medium text-sm"
              rows={2} placeholder="Descreva os detalhes do serviço..."
            ></textarea>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Ordem de Exibição</label>
            <input
              type="number" value={serviceOrder} onChange={(e) => setServiceOrder(e.target.value)}
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
              type="button" onClick={onClose}
              className="px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-md transition-all active:scale-[0.98]"
            >
              {editingService ? 'Salvar Alterações' : 'Cadastrar Serviço'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
