import React from 'react';
import { Camera } from 'lucide-react';
import { Barber } from '../../../types';
import { formatBRL } from '../../../utils/validation';
import { DEFAULT_AVATAR } from '../../../services/dataService';

interface BarberProfileHeaderProps {
  activeBarber: Barber;
  todayBookingsCount: number;
  pendingTodayCount: number;
  totalEarnings: number;
  onEditProfile: () => void;
}

export const BarberProfileHeader: React.FC<BarberProfileHeaderProps> = ({
  activeBarber,
  todayBookingsCount,
  pendingTodayCount,
  totalEarnings,
  onEditProfile
}) => {
  return (
    <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
        <div className="relative shrink-0">
          <img
            src={activeBarber.avatar || DEFAULT_AVATAR}
            alt={activeBarber.name}
            referrerPolicy="no-referrer"
            className="w-20 h-20 rounded-full object-cover border-4 border-slate-800 shadow-lg"
            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
          />
          <button
            type="button"
            onClick={onEditProfile}
            title="Editar meu perfil"
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 border-2 border-slate-900 flex items-center justify-center text-white shadow-md transition-colors"
          >
            <Camera size={14} />
          </button>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-indigo-400 font-bold">Painel de Trabalho</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-sans mt-0.5">{activeBarber.name}</h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">{activeBarber.specialty}</p>
          <button
            type="button"
            onClick={onEditProfile}
            className="mt-2 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
          >
            Editar meu perfil
          </button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
        <div className="bg-white/5 border border-white/10 p-3 rounded-xl text-center">
          <p className="text-[10px] text-slate-400 font-semibold uppercase">Hoje</p>
          <p className="text-lg font-extrabold text-white mt-0.5">{todayBookingsCount}</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-3 rounded-xl text-center">
          <p className="text-[10px] text-slate-400 font-semibold uppercase">Restantes</p>
          <p className="text-lg font-extrabold text-white mt-0.5">{pendingTodayCount}</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-3 rounded-xl text-center">
          <p className="text-[10px] text-slate-400 font-semibold uppercase">Faturamento</p>
          <p className="text-base font-extrabold text-indigo-400 mt-1">{formatBRL(totalEarnings)}</p>
        </div>
      </div>
    </div>
  );
};
