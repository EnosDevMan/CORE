import React from 'react';
import { AlertTriangle, CalendarCheck } from 'lucide-react';
import { useCustomerDashboard } from '../features/customer/hooks/useCustomerDashboard';
import { BookingCard } from '../features/customer/components/BookingCard';
import { CustomerHistoryTable } from '../features/customer/components/CustomerHistoryTable';

export const CustomerDashboard: React.FC = () => {
  const {
    currentUser,
    config,
    upcomingBookings,
    pastBookings,
    reschedulingBookingId,
    setReschedulingBookingId,
    newDate,
    newTime,
    setNewTime,
    availableTimes,
    successMsg,
    errorMsg,
    handleCancel,
    handleConfirmAttendance,
    handleOpenReschedule,
    handleDateChange,
    handleConfirmReschedule,
    getProfessionalName,
    getServiceName,
    getServiceDuration,
    formatBRL
  } = useCustomerDashboard();

  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <AlertTriangle size={48} className="text-amber-500 mx-auto mb-4 animate-bounce" />
        <h3 className="text-xl font-bold text-slate-950">Acesso Restrito</h3>
        <p className="text-slate-500 text-sm mt-2">
          Por favor, faça login ou realize um agendamento para poder visualizar esta página.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Confirmado':
        return <span className="bg-emerald-100 text-emerald-700 py-1 px-2.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide">Confirmado</span>;
      case 'Em atendimento':
        return <span className="bg-blue-100 text-blue-700 py-1 px-2.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide">Em Atend.</span>;
      case 'Concluído':
        return <span className="bg-slate-100 text-slate-600 py-1 px-2.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide">Concluído</span>;
      case 'Cancelado':
        return <span className="bg-red-100 text-red-600 py-1 px-2.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide">Cancelado</span>;
      case 'Não compareceu':
        return <span className="bg-slate-200 text-slate-600 py-1 px-2.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide">Não Compareceu</span>;
      case 'Aguardando pagamento':
      default:
        return <span className="bg-amber-100 text-amber-700 py-1 px-2.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide">Pendente</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="mb-10">
        <h2 className="font-sans font-extrabold text-3xl tracking-tight text-slate-900">
          Olá, {currentUser.name.split(' ')[0]} 👋
        </h2>
        <p className="text-sm text-slate-500 mt-2">Acompanhe e gerencie seus agendamentos.</p>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 rounded-xl mb-6 text-sm font-semibold animate-in slide-in-from-top-2">
          {successMsg}
        </div>
      )}

      {/* UPCOMING APPOINTMENTS */}
      <div className="space-y-6">
        <div>
          <h3 className="font-sans font-extrabold text-lg text-slate-900 flex items-center gap-2">
            Próximos Agendamentos ({upcomingBookings.length})
          </h3>
          <p className="text-xs text-slate-500 mt-1">Seus horários marcados que ainda vão acontecer.</p>
        </div>

        {upcomingBookings.length > 0 ? (
          <div className="space-y-4">
            {upcomingBookings.map(booking => (
              <BookingCard
                key={booking.id}
                booking={booking}
                bookingWindowDays={config.bookingWindowDays}
                getServiceName={getServiceName}
                getServiceDuration={getServiceDuration}
                getProfessionalName={getProfessionalName}
                formatBRL={formatBRL}
                getStatusBadge={getStatusBadge}
                isRescheduling={reschedulingBookingId === booking.id}
                handleOpenReschedule={handleOpenReschedule}
                handleCancel={handleCancel}
                  handleConfirmAttendance={handleConfirmAttendance}
                newDate={newDate}
                newTime={newTime}
                availableTimes={availableTimes}
                errorMsg={errorMsg}
                handleDateChange={handleDateChange}
                setNewTime={setNewTime}
                setReschedulingBookingId={setReschedulingBookingId}
                handleConfirmReschedule={handleConfirmReschedule}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-500 shadow-sm">
            <CalendarCheck size={36} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-slate-800">Nenhum agendamento futuro marcado.</p>
            <p className="text-xs text-slate-400 mt-1">Quando você agendar um horário, ele aparecerá aqui.</p>
          </div>
        )}
      </div>

      {/* PAST APPOINTMENTS / HISTORY */}
      <div className="space-y-6 mt-16">
        <div>
          <h3 className="font-sans font-extrabold text-lg text-slate-900 flex items-center gap-2">
            Histórico de Serviços ({pastBookings.length})
          </h3>
          <p className="text-xs text-slate-500 mt-1">Registros dos seus atendimentos anteriores.</p>
        </div>
        <CustomerHistoryTable
          pastBookings={pastBookings}
          getServiceName={getServiceName}
          getProfessionalName={getProfessionalName}
          formatBRL={formatBRL}
          getStatusBadge={getStatusBadge}
        />
      </div>
    </div>
  );
};
