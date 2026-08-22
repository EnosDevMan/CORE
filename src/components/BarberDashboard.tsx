import React, { useState } from 'react';
import { AlertCircle, BarChart3, CalendarDays, CheckCircle, Clock3, History } from 'lucide-react';
import { withRoleGuard } from '../auth/middleware/withRoleGuard';
import { useBarberDashboard } from '../features/barber/hooks/useBarberDashboard';
import { BarberProfileHeader } from '../features/barber/components/BarberProfileHeader';
import { BarberProfileEditModal } from '../features/barber/components/BarberProfileEditModal';
import { BarberScheduleTimeline } from '../features/barber/components/BarberScheduleTimeline';
import { BarberUpcomingSchedule } from '../features/barber/components/BarberUpcomingSchedule';
import { BarberStats } from '../features/barber/components/BarberStats';
import { BarberHistory } from '../features/barber/components/BarberHistory';
import { BarberScheduleBlocks } from '../features/barber/components/BarberScheduleBlocks';

const BarberDashboardInner: React.FC = () => {
  const {
    currentUser,
    barbers,
    activeBarberId,
    setActiveBarberId,
    activeBarber,
    todayBookings,
    futureBookings,
    pastBookings,
    pendingToday,
    totalEarnings,
    statsPeriod,
    setStatsPeriod,
    serviceStatsList,
    totalPeriodValue,
    handleStatusChange,
    getStatusBadgeColor,
    getFormattedDate,
    getWhatsAppLink,
    getServiceName,
    formatBRL,
    config,
    barberBookings,
    updateBarber,
    successMessage,
    setSuccessMessage,
    errorMessage,
    setErrorMessage,
    showFeedback
  } = useBarberDashboard();

  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [activeSection, setActiveSection] = useState<'schedule' | 'performance' | 'history'>('schedule');

  const sections = [
    { id: 'schedule' as const, label: 'Minha agenda', shortLabel: 'Agenda', icon: CalendarDays, count: todayBookings.length + futureBookings.length },
    { id: 'performance' as const, label: 'Desempenho', shortLabel: 'Resultados', icon: BarChart3 },
    { id: 'history' as const, label: 'Histórico', shortLabel: 'Histórico', icon: History, count: pastBookings.length },
  ];

  return (
    <div className="min-h-screen bg-slate-50/70">
      <div className="max-w-6xl mx-auto py-6 sm:py-10 px-4 sm:px-6">
        <div className="mb-6 sm:mb-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-indigo-600">Área do profissional</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-slate-950">Seu dia de trabalho, em um só lugar</h1>
          <p className="mt-2 text-sm text-slate-500">Consulte sua agenda, atualize atendimentos e acompanhe seus resultados.</p>
        </div>
      {/* Messages - mesmo padrão visual do AdminDashboard.tsx */}
      {successMessage && (
        <div className="mb-6 bg-gradient-to-r from-emerald-50 to-emerald-100 border-2 border-emerald-300 rounded-xl px-6 py-4 flex items-center gap-4 shadow-sm">
          <CheckCircle className="text-emerald-600 flex-shrink-0" size={24} />
          <p className="text-emerald-900 font-semibold text-sm flex-1">{successMessage}</p>
          <button
            onClick={() => setSuccessMessage('')}
            className="text-emerald-600 hover:text-emerald-800 font-bold text-xl"
          >
            ×
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 bg-gradient-to-r from-rose-50 to-rose-100 border-2 border-rose-300 rounded-xl px-6 py-4 flex items-center gap-4 shadow-sm">
          <AlertCircle className="text-rose-600 flex-shrink-0" size={24} />
          <p className="text-rose-900 font-semibold text-sm flex-1">{errorMessage}</p>
          <button
            onClick={() => setErrorMessage('')}
            className="text-rose-600 hover:text-rose-800 font-bold text-xl"
          >
            ×
          </button>
        </div>
      )}

      {/* Simulation Banner & Select Barbeiro */}
      {!currentUser?.profileId && (
        <div className="mb-6 p-4 bg-slate-100 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-slate-600" />
            <p className="text-xs text-slate-700 font-medium">
              Você está acessando como <strong>Simulação de Equipe</strong>. Escolha um barbeiro para ver a sua agenda individual:
            </p>
          </div>
          <select
            value={activeBarberId}
            onChange={(e) => setActiveBarberId(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 bg-white rounded-lg text-xs font-bold text-slate-800 focus:outline-none"
          >
            {barbers.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Profile Header */}
      {activeBarber && (
        <BarberProfileHeader
          activeBarber={activeBarber}
          todayBookingsCount={todayBookings.length}
          pendingTodayCount={pendingToday}
          totalEarnings={totalEarnings}
          onEditProfile={() => setShowProfileEdit(true)}
        />
      )}

      {showProfileEdit && activeBarber && (
        <BarberProfileEditModal
          barber={activeBarber}
          onClose={() => setShowProfileEdit(false)}
          onSave={updateBarber}
          setSuccessMessage={setSuccessMessage}
          setErrorMessage={setErrorMessage}
        />
      )}

      <nav aria-label="Navegação do painel do barbeiro" className="sticky top-2 z-20 mb-6 rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-sm backdrop-blur">
        <div className="grid grid-cols-3 gap-1">
          {sections.map(({ id, label, shortLabel, icon: Icon, count }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveSection(id)}
              aria-current={activeSection === id ? 'page' : undefined}
              className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-2 sm:px-4 text-xs sm:text-sm font-bold transition-all ${
                activeSection === id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon size={17} />
              <span className="sm:hidden">{shortLabel}</span>
              <span className="hidden sm:inline">{label}</span>
              {typeof count === 'number' && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${activeSection === id ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      <main>
        {activeSection === 'schedule' && (
          <section aria-labelledby="schedule-heading" className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600"><Clock3 size={14} /> Rotina de hoje</p>
                <h2 id="schedule-heading" className="mt-1 text-xl font-black text-slate-900">Minha agenda</h2>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-right shadow-sm">
                <p className="text-[10px] font-bold uppercase text-slate-400">A fazer hoje</p>
                <p className="text-lg font-black leading-none text-slate-900">{pendingToday}</p>
              </div>
            </div>
            <BarberScheduleTimeline
              todayBookings={todayBookings}
              config={config}
              getServiceName={getServiceName}
              getStatusBadgeColor={getStatusBadgeColor}
              getWhatsAppLink={getWhatsAppLink}
              handleStatusChange={handleStatusChange}
            />
            {activeBarberId && <BarberScheduleBlocks barberId={activeBarberId} showFeedback={showFeedback} />}
            <BarberUpcomingSchedule
              futureBookings={futureBookings}
              getServiceName={getServiceName}
              getFormattedDate={getFormattedDate}
              getStatusBadgeColor={getStatusBadgeColor}
              handleStatusChange={handleStatusChange}
            />
          </section>
        )}

        {activeSection === 'performance' && (
          <section aria-labelledby="performance-heading" className="space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Visão financeira</p>
              <h2 id="performance-heading" className="mt-1 text-xl font-black text-slate-900">Meu desempenho</h2>
              <p className="mt-1 text-sm text-slate-500">Acompanhe atendimentos concluídos e faturamento por período.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <BarberStats
                totalEarnings={totalEarnings}
                completedBookingsCount={barberBookings.filter(b => b.status === 'Concluído').length}
                formatBRL={formatBRL}
                statsPeriod={statsPeriod}
                setStatsPeriod={setStatsPeriod}
                serviceStatsList={serviceStatsList}
                totalPeriodValue={totalPeriodValue}
              />
            </div>
          </section>
        )}

        {activeSection === 'history' && (
          <section aria-labelledby="history-heading" className="space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Atendimentos anteriores</p>
              <h2 id="history-heading" className="mt-1 text-xl font-black text-slate-900">Histórico de trabalho</h2>
              <p className="mt-1 text-sm text-slate-500">Consulte os serviços e o status dos seus atendimentos passados.</p>
            </div>
            <BarberHistory
              pastBookings={pastBookings}
              getServiceName={getServiceName}
              getStatusBadgeColor={getStatusBadgeColor}
              handleStatusChange={handleStatusChange}
            />
          </section>
        )}
      </main>
      </div>
    </div>
  );
};

// Segunda camada de proteção RBAC (ver mesmo padrão em AdminDashboard.tsx).
// 'admin' também é permitido aqui porque o modo de simulação (ver
// useBarberDashboard) deixa um admin visualizar a agenda "como se fosse"
// um barbeiro específico.
export const BarberDashboard = withRoleGuard(BarberDashboardInner, ['admin', 'barber']);
