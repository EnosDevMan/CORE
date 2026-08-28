import React, { useEffect, useMemo, useState } from 'react';
import { DollarSign, Clock, UserPlus, Calendar as CalendarIcon, CheckCircle, XCircle, ArrowRight, User, Scissors } from 'lucide-react';
import { useUsers } from '../../../store/useApp';
import type { Booking, BookingStatus } from '../../../types';
import { getBusinessNow } from '../../../utils/validation';
import { useBusinessToday } from '../../../hooks/useBusinessToday';
import { BookingStatusActions } from '../../../components/BookingStatusActions';
import { AdminRescheduleDialog } from './agenda/AdminRescheduleDialog';
import { useBusiness, useNiche } from '../../../core/business/hooks';
import { isCustomerRole } from '../../../auth/authorization';
import { adminHistoryService } from '../../../services/adminHistoryService';
import { getErrorMessage } from '../../../utils/errors';

interface AdminOverviewTabProps {
  formatBRL: (value: number) => string;
  getProfessionalName: (id: string) => string;
  getServiceName: (id: string) => string;
  handleUpdateBookingStatus: (id: string, newStatus: BookingStatus, sourceBooking?: Booking) => Promise<boolean>;
  onViewFullReport: () => void;
  canViewReports: boolean;
  showFeedback: (message: string, isError: boolean) => void;
}

/** Resumo operacional diário carregado diretamente para a data do negócio. */
export const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({
  formatBRL,
  getProfessionalName,
  getServiceName,
  handleUpdateBookingStatus,
  onViewFullReport,
  canViewReports,
  showFeedback,
}) => {
  const users = useUsers();
  const niche = useNiche();
  const { profile } = useBusiness();
  const todayStr = useBusinessToday(profile.timezone);
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [bookingsError, setBookingsError] = useState('');
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [rescheduling, setRescheduling] = useState<Booking | null>(null);

  useEffect(() => {
    let active = true;
    setLoadingBookings(true);
    setBookingsError('');
    void adminHistoryService.loadBookingsRange(todayStr, todayStr)
      .then(rows => { if (active) setTodayBookings(rows); })
      .catch(error => { if (active) { setTodayBookings([]); setBookingsError(getErrorMessage(error, 'Não foi possível carregar os agendamentos de hoje.')); } })
      .finally(() => { if (active) setLoadingBookings(false); });
    return () => { active = false; };
  }, [loadAttempt, todayStr]);

  const revenueToday = useMemo(
    () => todayBookings.filter(booking => booking.status === 'Concluído').reduce((acc, booking) => acc + booking.value, 0),
    [todayBookings],
  );

  const pendingTodayCount = useMemo(
    () => todayBookings.filter(booking => booking.status === 'Aguardando pagamento' || booking.status === 'Confirmado').length,
    [todayBookings],
  );

  const newCustomersToday = useMemo(
    () => users.filter(user => isCustomerRole(user.role)
      && Boolean(user.createdAt)
      && getBusinessNow(profile.timezone, new Date(user.createdAt as string)).dateStr === todayStr).length,
    [profile.timezone, todayStr, users],
  );

  const todayLabel = new Date(todayStr + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  });

  const updateStatus = async (id: string, status: BookingStatus) => {
    const source = todayBookings.find(booking => booking.id === id);
    if (!source || !(await handleUpdateBookingStatus(id, status, source))) return;
    setTodayBookings(rows => rows.map(booking => booking.id === id ? { ...booking, status } : booking));
  };

  const getStatusChip = (status: BookingStatus) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 ${
      status === 'Aguardando pagamento' ? 'bg-amber-50 text-amber-700 border-amber-200' :
      status === 'Confirmado' ? 'bg-blue-50 text-blue-700 border-blue-200' :
      status === 'Concluído' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
      status === 'Cancelado' ? 'bg-rose-50 text-rose-700 border-rose-200' :
      'bg-slate-100 text-slate-600 border-slate-200'
    }`}>
      {status === 'Confirmado' && <Clock size={11} />}
      {status === 'Concluído' && <CheckCircle size={11} />}
      {status === 'Cancelado' && <XCircle size={11} />}
      {status}
    </span>
  );

  const renderActions = (booking: Booking) => {
    if (booking.status === 'Concluído' || booking.status === 'Cancelado' || booking.status === 'Não compareceu') return null;
    return <div className="flex items-center gap-2 flex-wrap">
      <BookingStatusActions booking={booking} handleStatusChange={updateStatus} onReschedule={setRescheduling} />
    </div>;
  };

  const handleRescheduled = (updated: Booking) => {
    setTodayBookings(rows => updated.date === todayStr
      ? rows.map(booking => booking.id === updated.id ? updated : booking).sort((a, b) => a.time.localeCompare(b.time))
      : rows.filter(booking => booking.id !== updated.id));
  };

  return (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
        <div>
          <p className="text-xs font-semibold text-slate-400">Resumo de hoje</p>
          <p className="text-sm font-bold text-slate-800 mt-0.5 capitalize">{todayLabel}</p>
        </div>
        {canViewReports && <button
          onClick={onViewFullReport}
          className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 px-2 py-2 rounded-lg transition-colors"
        >
          Ver relatório completo <ArrowRight size={14} />
        </button>}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="col-span-2 sm:col-span-1 bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-semibold">Faturamento de Hoje</p>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-950 mt-1 font-sans">{formatBRL(revenueToday)}</p>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">Serviços concluídos hoje</p>
          </div>
          <div className="p-2.5 sm:p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0"><DollarSign size={20} /></div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-semibold">{niche.dashboard.todayLabel}</p>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-950 mt-1 font-sans">{todayBookings.length}</p>
          </div>
          <div className="p-2.5 sm:p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0"><CalendarIcon size={20} /></div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-semibold">Aguardando Hoje</p>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-950 mt-1 font-sans">{pendingTodayCount}</p>
            <p className="text-[10px] text-amber-600 font-bold mt-1">Pagamento ou confirmação</p>
          </div>
          <div className="p-2.5 sm:p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0"><Clock size={20} /></div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-semibold">Novos Clientes</p>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-950 mt-1 font-sans">{newCustomersToday}</p>
            <p className="text-[10px] text-slate-400 mt-1">Cadastrados hoje</p>
          </div>
          <div className="p-2.5 sm:p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0"><UserPlus size={20} /></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-extrabold text-slate-900 tracking-tight text-lg">{niche.dashboard.scheduleLabel}</h3>
          <p className="text-xs text-slate-500 mt-1">Ordenados por horário</p>
        </div>

        {loadingBookings ? (
          <p className="px-6 py-10 text-center text-slate-400 text-sm">Carregando agendamentos de hoje...</p>
        ) : bookingsError ? (
          <p className="px-6 py-10 text-center text-rose-600 text-sm">{bookingsError} <button type="button" className="font-bold underline" onClick={() => setLoadAttempt(value => value + 1)}>Tentar novamente</button></p>
        ) : todayBookings.length === 0 ? (
          <p className="px-6 py-10 text-center text-slate-400 text-sm">Nenhum agendamento para hoje.</p>
        ) : (
          <>
            <div className="sm:hidden divide-y divide-slate-100">
              {todayBookings.map(booking => (
                <div key={booking.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">{booking.customerName}</p>
                      <p className="text-[11px] text-slate-400">{booking.customerPhone}</p>
                    </div>
                    {getStatusChip(booking.status)}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="font-bold text-slate-700">{booking.time}h</span>
                    <span className="inline-flex items-center gap-1"><User size={11} className="text-slate-400" />{getProfessionalName(booking.professionalId)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Scissors size={11} className="text-slate-400 shrink-0" />
                    <span className="truncate">{getServiceName(booking.serviceId)}</span>
                  </div>
                  {booking.status !== 'Concluído' && booking.status !== 'Cancelado' && booking.status !== 'Não compareceu' && (
                    <div className="pt-1.5 border-t border-slate-100 flex justify-end">{renderActions(booking)}</div>
                  )}
                </div>
              ))}
            </div>

            <div className="hidden sm:block overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 font-bold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Horário</th>
                    <th className="px-6 py-4">Profissional</th>
                    <th className="px-6 py-4">Serviço</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {todayBookings.map(booking => (
                    <tr key={booking.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        <div className="flex flex-col">
                          <span>{booking.customerName}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{booking.customerPhone}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">{booking.time}h</td>
                      <td className="px-6 py-4"><span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">{getProfessionalName(booking.professionalId)}</span></td>
                      <td className="px-6 py-4"><span className="text-slate-600 font-medium text-xs">{getServiceName(booking.serviceId)}</span></td>
                      <td className="px-6 py-4">{getStatusChip(booking.status)}</td>
                      <td className="px-6 py-4 text-right">{renderActions(booking)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      {rescheduling && <AdminRescheduleDialog booking={rescheduling} onClose={() => setRescheduling(null)} showFeedback={showFeedback} onRescheduled={handleRescheduled} />}
    </div>
  );
};
