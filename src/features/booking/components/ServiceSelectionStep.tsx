import React from 'react';
import { Service } from '../../../types';
import { Check } from 'lucide-react';
import { formatBRL } from '../../../utils/validation';

interface Props {
  services: Service[];
  selectedServices: Service[];
  toggleService: (service: Service) => void;
}

export const ServiceSelectionStep: React.FC<Props> = React.memo(({ services, selectedServices, toggleService }) => {
  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
      {services.map(service => {
        const isSelected = selectedServices.some(s => s.id === service.id);
        return (
          <div
            key={service.id}
            onClick={() => toggleService(service)}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
              isSelected
                ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div>
              <h4 className={`font-bold text-[15px] ${isSelected ? 'text-indigo-950' : 'text-slate-800'}`}>
                {service.name}
              </h4>
              <p className="text-sm text-slate-500 mt-0.5">{service.duration} minutos</p>
            </div>
            <div className="flex items-center gap-4">
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
          </div>
        );
      })}
    </div>
  );
});
