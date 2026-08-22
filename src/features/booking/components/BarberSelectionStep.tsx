import React from 'react';
import { Barber } from '../../../types';
import { DEFAULT_AVATAR } from '../../../services/dataService';

interface Props {
  barbers: Barber[];
  selectedBarber: Barber | null;
  selectBarber: (barber: Barber) => void;
}

export const BarberSelectionStep: React.FC<Props> = React.memo(({ barbers, selectedBarber, selectBarber }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
      {barbers.map(barber => {
        const isSelected = selectedBarber?.id === barber.id;
        return (
          <div
            key={barber.id}
            onClick={() => selectBarber(barber)}
            className={`p-4 rounded-xl border-2 text-center transition-all cursor-pointer flex flex-col items-center gap-3 ${
              isSelected
                ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className={`w-16 h-16 rounded-full overflow-hidden border-2 transition-colors ${
              isSelected ? 'border-indigo-600' : 'border-transparent'
            }`}>
              <img 
                src={barber.avatar || DEFAULT_AVATAR} 
                alt={barber.name} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                }}
              />
            </div>
            <div>
              <h4 className={`font-bold text-sm ${isSelected ? 'text-indigo-950' : 'text-slate-800'}`}>
                {barber.name}
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">{barber.specialty || 'Profissional'}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
});
