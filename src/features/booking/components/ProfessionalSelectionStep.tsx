import React from 'react';
import type { Professional } from '../../professionals/types';
import { DEFAULT_PROFESSIONAL_AVATAR } from '../../professionals/constants';

interface Props {
  professionals: Professional[];
  selectedProfessional: Professional | null;
  selectProfessional: (professional: Professional) => void;
}

export const ProfessionalSelectionStep: React.FC<Props> = React.memo(({ professionals, selectedProfessional, selectProfessional }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
      {professionals.map(professional => {
        const isSelected = selectedProfessional?.id === professional.id;
        return (
          <button
            type="button"
            key={professional.id}
            onClick={() => selectProfessional(professional)}
            aria-pressed={isSelected}
            className={`w-full p-4 rounded-xl border-2 text-center transition-all cursor-pointer flex flex-col items-center gap-3 ${
              isSelected
                ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className={`w-16 h-16 rounded-full overflow-hidden border-2 transition-colors ${
              isSelected ? 'border-indigo-600' : 'border-transparent'
            }`}>
              <img
                src={professional.avatar || DEFAULT_PROFESSIONAL_AVATAR}
                alt={professional.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_PROFESSIONAL_AVATAR;
                }}
              />
            </div>
            <div>
              <h4 className={`font-bold text-sm ${isSelected ? 'text-indigo-950' : 'text-slate-800'}`}>
                {professional.name}
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">{professional.specialty || 'Profissional'}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
});
