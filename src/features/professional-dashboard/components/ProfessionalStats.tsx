import React from 'react';
import { DollarSign, Scissors, TrendingUp } from 'lucide-react';

interface ProfessionalStatsProps {
  totalEarnings: number;
  completedBookingsCount: number;
  formatBRL: (val: number) => string;
  statsPeriod: 'day' | 'week' | 'month';
  setStatsPeriod: (period: 'day' | 'week' | 'month') => void;
  serviceStatsList: { id: string; name: string; count: number; totalValue: number }[];
  totalPeriodValue: number;
}

export const ProfessionalStats: React.FC<ProfessionalStatsProps> = ({
  totalEarnings,
  completedBookingsCount,
  formatBRL,
  statsPeriod,
  setStatsPeriod,
  serviceStatsList,
  totalPeriodValue
}) => {
  return (
    <>
      <div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-sm space-y-6">
        <h3 className="font-bold text-sm uppercase tracking-wider text-indigo-300">Resumo de Performance</h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white/5 border border-white/15 p-4 rounded-xl">
            <div>
              <p className="text-slate-400 text-xs">Faturamento (Histórico)</p>
              <p className="text-2xl font-extrabold font-sans text-white mt-1">{formatBRL(totalEarnings)}</p>
            </div>
            <DollarSign size={24} className="text-indigo-400 opacity-60" />
          </div>
          <div className="flex justify-between items-center bg-white/5 border border-white/15 p-4 rounded-xl">
            <div>
              <p className="text-slate-400 text-xs">Trabalhos Realizados</p>
              <p className="text-2xl font-extrabold font-sans text-white mt-1">
                {completedBookingsCount} cortes
              </p>
            </div>
            <Scissors size={24} className="text-indigo-400 opacity-60" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-sans font-extrabold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <TrendingUp size={16} className="text-indigo-600" />
              Serviços & Faturamento
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">Seus atendimentos concluídos e valores gerados.</p>
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setStatsPeriod('day')}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                statsPeriod === 'day' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Hoje
            </button>
            <button
              onClick={() => setStatsPeriod('week')}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                statsPeriod === 'week' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setStatsPeriod('month')}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                statsPeriod === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Mês
            </button>
          </div>
        </div>

        {serviceStatsList.length > 0 ? (
          <div className="space-y-3">
            <div className="divide-y divide-slate-100">
              {serviceStatsList.map((stat) => (
                <div key={stat.id} className="py-2 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-slate-800">{stat.name}</p>
                    <p className="text-slate-400 text-[10px] mt-0.5">{stat.count}x realizado{stat.count > 1 ? 's' : ''}</p>
                  </div>
                  <span className="font-semibold text-slate-900 font-mono">{formatBRL(stat.totalValue)}</span>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-between items-center bg-slate-50 -mx-6 -mb-6 p-4 rounded-b-2xl">
              <span className="text-xs font-bold text-slate-600">Faturamento no Período:</span>
              <span className="text-sm font-extrabold text-indigo-600 font-mono">{formatBRL(totalPeriodValue)}</span>
            </div>
          </div>
        ) : (
          <p className="text-slate-400 text-xs py-4 text-center">Nenhum serviço realizado neste período.</p>
        )}
      </div>
    </>
  );
};
