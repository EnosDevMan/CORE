import React from 'react';
import { DollarSign, CheckCircle, XCircle, Clock, UserX, ChevronLeft, ChevronRight, CalendarRange } from 'lucide-react';
import { useAdminReports, ReportPeriod } from '../hooks/useAdminReports';

interface AdminReportsTabProps {
  formatBRL: (value: number) => string;
}

const PERIOD_TABS: { id: ReportPeriod; label: string }[] = [
  { id: 'day', label: 'Diário' },
  { id: 'week', label: 'Semanal' },
  { id: 'month', label: 'Mensal' },
  { id: 'year', label: 'Anual' },
  { id: 'custom', label: 'Personalizado' },
];

const CHART_UNIT_LABEL: Record<ReportPeriod, string> = {
  day: 'dia',
  week: 'dia',
  month: 'semana',
  year: 'mês',
  custom: 'período',
};

export const AdminReportsTab: React.FC<AdminReportsTabProps> = ({ formatBRL }) => {
  const {
    period,
    setPeriod,
    goToPreviousPeriod,
    goToNextPeriod,
    isCurrentPeriod,
    rangeLabel,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    todayStr,
    completedCount,
    cancelledCount,
    noShowCount,
    pendingCount,
    revenueInRange,
    chartData,
    maxChartValue,
    barberBreakdown,
    serviceBreakdown,
  } = useAdminReports();

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Filtro de período — em telas pequenas as abas quebram em 2
          linhas (em vez de forçar 5 abas espremidas numa linha só, onde
          "Personalizado" ficaria cortado) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap bg-slate-100 p-1 rounded-lg border border-slate-200 gap-1">
          {PERIOD_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id)}
              className={`flex-1 min-w-[calc(50%-0.125rem)] sm:min-w-0 sm:flex-none text-xs font-bold px-3 py-2 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                period === tab.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {period === 'custom' ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <label className="text-xs font-bold text-slate-500 shrink-0">De</label>
              <input
                type="date"
                value={customStartDate}
                max={customEndDate || todayStr}
                onChange={e => setCustomStartDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
              />
            </div>
            <div className="flex items-center gap-2 flex-1">
              <label className="text-xs font-bold text-slate-500 shrink-0">Até</label>
              <input
                type="date"
                value={customEndDate}
                min={customStartDate}
                max={todayStr}
                onChange={e => setCustomEndDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 shrink-0 sm:pl-1">
              <CalendarRange size={14} className="text-slate-400" />
              {rangeLabel}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between sm:justify-end gap-3">
            <button
              onClick={goToPreviousPeriod}
              className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-colors cursor-pointer"
              title="Período anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-slate-700 text-center flex-1 sm:flex-none">{rangeLabel}</span>
            <button
              onClick={goToNextPeriod}
              disabled={isCurrentPeriod}
              className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Próximo período"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Stats do período */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6">
        <div className="col-span-2 sm:col-span-1 bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-semibold">Faturamento</p>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-950 mt-1 font-sans">{formatBRL(revenueInRange)}</p>
          </div>
          <div className="p-2.5 sm:p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0"><DollarSign size={20} /></div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-semibold">Concluídos</p>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-950 mt-1 font-sans">{completedCount}</p>
          </div>
          <div className="p-2.5 sm:p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0"><CheckCircle size={20} /></div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-semibold">Pendentes</p>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-950 mt-1 font-sans">{pendingCount}</p>
          </div>
          <div className="p-2.5 sm:p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0"><Clock size={20} /></div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-semibold">Cancelados</p>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-950 mt-1 font-sans">{cancelledCount}</p>
          </div>
          <div className="p-2.5 sm:p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0"><XCircle size={20} /></div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-semibold">Não Compareceu</p>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-950 mt-1 font-sans">{noShowCount}</p>
          </div>
          <div className="p-2.5 sm:p-3 bg-slate-100 text-slate-500 rounded-xl shrink-0"><UserX size={20} /></div>
        </div>
      </div>

      {/* Gráfico de evolução (não existe para o filtro "Diário", que é um único dia) */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6">
          <h3 className="font-extrabold text-slate-900 tracking-tight text-lg mb-1">Evolução do Faturamento</h3>
          <p className="text-xs text-slate-500 mb-6">Serviços concluídos, por {CHART_UNIT_LABEL[period]}.</p>
          <div className="flex items-end gap-2 sm:gap-4 h-48 overflow-x-auto custom-scrollbar">
            {chartData.map((bucket) => (
              <div key={bucket.start} className="flex-1 min-w-8 flex flex-col items-center justify-end h-full gap-2">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-600 font-mono whitespace-nowrap">
                  {bucket.value > 0 ? formatBRL(bucket.value) : ''}
                </span>
                <div
                  className="w-full max-w-10 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-md transition-all"
                  style={{ height: `${Math.max(4, (bucket.value / maxChartValue) * 100)}%` }}
                  title={`${bucket.label}: ${formatBRL(bucket.value)}`}
                />
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">{bucket.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detalhamento por profissional e por serviço */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6">
          <h3 className="font-extrabold text-slate-900 tracking-tight text-xs uppercase mb-4">Faturamento por Profissional</h3>
          {barberBreakdown.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {barberBreakdown.map(item => (
                <div key={item.id} className="py-3 flex justify-between items-center text-sm">
                  <div>
                    <p className="font-bold text-slate-800">{item.name}</p>
                    <p className="text-slate-400 text-[10px] mt-0.5">{item.count}x atendimento{item.count > 1 ? 's' : ''}</p>
                  </div>
                  <span className="font-bold text-slate-900 font-mono text-sm">{formatBRL(item.total)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-xs py-4 text-center">Nenhum atendimento concluído neste período.</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6">
          <h3 className="font-extrabold text-slate-900 tracking-tight text-xs uppercase mb-4">Faturamento por Serviço</h3>
          {serviceBreakdown.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {serviceBreakdown.map(item => (
                <div key={item.id} className="py-3 flex justify-between items-center text-sm">
                  <div>
                    <p className="font-bold text-slate-800">{item.name}</p>
                    <p className="text-slate-400 text-[10px] mt-0.5">{item.count}x realizado{item.count > 1 ? 's' : ''}</p>
                  </div>
                  <span className="font-bold text-slate-900 font-mono text-sm">{formatBRL(item.total)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-xs py-4 text-center">Nenhum serviço concluído neste período.</p>
          )}
        </div>
      </div>
    </div>
  );
};
