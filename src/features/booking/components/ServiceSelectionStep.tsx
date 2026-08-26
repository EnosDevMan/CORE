import React, { useMemo, useState } from 'react';
import { Service } from '../../../types';
import { Check, Clock3 } from 'lucide-react';
import { formatBRL } from '../../../utils/validation';

interface Props {
  services: Service[];
  selectedServices: Service[];
  toggleService: (service: Service) => void;
}

export const ServiceSelectionStep: React.FC<Props> = React.memo(({ services, selectedServices, toggleService }) => {
  const categories = useMemo(
    () => Array.from(new Set(services.map(service => service.category?.trim()).filter((value): value is string => Boolean(value)))),
    [services],
  );
  const [activeCategory, setActiveCategory] = useState('Todos');
  const visibleServices = activeCategory === 'Todos'
    ? services
    : services.filter(service => service.category === activeCategory);
  const selectedDuration = selectedServices.reduce((total, service) => total + service.duration, 0);
  const selectedPrice = selectedServices.reduce((total, service) => total + service.price, 0);

  if (services.length === 0) {
    return (
      <div role="status" className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        Nenhum serviço está disponível para agendamento no momento.
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      {categories.length > 1 && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar" role="tablist" aria-label="Categorias de serviços">
          {['Todos', ...categories].map(category => (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={activeCategory === category}
              onClick={() => setActiveCategory(category)}
              className={`min-h-10 shrink-0 rounded-full border px-3.5 text-xs font-bold transition-colors ${
                activeCategory === category
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {selectedServices.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3">
          <div>
            <p className="text-xs font-bold text-indigo-950">
              {selectedServices.length} {selectedServices.length === 1 ? 'serviço selecionado' : 'serviços selecionados'}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-indigo-600/70"><Clock3 size={12} /> Aproximadamente {selectedDuration} min</p>
          </div>
          <strong className="text-sm text-indigo-700">{formatBRL(selectedPrice)}</strong>
        </div>
      )}

      <div className="space-y-3">
        {visibleServices.map(service => {
          const isSelected = selectedServices.some(s => s.id === service.id);
          return (
            <button
              type="button"
              key={service.id}
              onClick={() => toggleService(service)}
              aria-pressed={isSelected}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                  : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="min-w-0">
                {service.category && <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{service.category}</p>}
                <h4 className={`font-bold text-[15px] ${isSelected ? 'text-indigo-950' : 'text-slate-800'}`}>
                  {service.name}
                </h4>
                <p className="text-sm text-slate-500 mt-0.5">{service.duration} minutos</p>
                {service.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{service.description}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className={`font-bold ${isSelected ? 'text-indigo-600' : 'text-slate-700'}`}>
                  {formatBRL(service.price)}
                </span>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                  isSelected 
                    ? 'bg-indigo-600 border-indigo-600' 
                    : 'border-slate-300'
                }`}>
                  {isSelected && <Check size={14} className="text-white" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});
