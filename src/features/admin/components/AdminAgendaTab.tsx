import React, { useState } from 'react';
import { Calendar as CalendarIcon, Search } from 'lucide-react';
import { useApp } from '../../../store/useApp';
import { getBarbershopTodayStr } from '../../../utils/validation';
import { getServiceName as getSharedServiceName, getBarberName as getSharedBarberName } from '../../../utils/lookups';
import { Booking, BookingStatus } from '../../../types';
import { BookingStatusActions } from '../../../components/BookingStatusActions';
import { AdminRescheduleDialog } from './agenda/AdminRescheduleDialog';

interface AdminAgendaTabProps {
  showFeedback: (msg: string, isError: boolean) => void;
}

export const AdminAgendaTab: React.FC<AdminAgendaTabProps> = ({ showFeedback }) => {
  const { bookings, barbers, services, updateBookingStatus } = useApp();

  // Usa a data "de hoje" no fuso horário da barbearia (não o fuso do
  // dispositivo do admin), para que o filtro padrão da agenda sempre
  // corresponda ao dia real de funcionamento da barbearia, mesmo que o
  // administrador esteja acessando de outro fuso horário.
  const [dateFilter, setDateFilter] = useState(getBarbershopTodayStr);
  const [barberFilter, setBarberFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<'day' | 'tomorrow' | 'week' | 'month'>('day');
  const [rescheduling, setRescheduling] = useState<Booking | null>(null);

  const getBarberName = (id: string) => getSharedBarberName(barbers, id);

  const getServiceName = (id: string) => getSharedServiceName(services, id);

  const handleStatusChange = (bookingId: string, newStatus: BookingStatus) => {
    if (updateBookingStatus) {
      updateBookingStatus(bookingId, newStatus);
      const statusMessages: Record<BookingStatus, string> = {
        'Confirmado': 'Agendamento confirmado!',
        'Concluído': 'Agendamento marcado como concluído!',
        'Cancelado': 'Agendamento cancelado!',
        'Aguardando pagamento': 'Status alterado para aguardando pagamento!',
        'Em atendimento': 'Status alterado para em atendimento!',
        'Não compareceu': 'Cliente marcado como não compareceu!',
        'Reagendado': 'Agendamento reagendado!'
      };
      showFeedback(statusMessages[newStatus] || 'Status atualizado!', false);
    }
  };

  const filteredBookings = bookings.filter(b => {
    const start = new Date(`${dateFilter}T12:00:00`);
    const end = new Date(start);
    if (period === 'tomorrow') { start.setDate(start.getDate() + 1); end.setDate(end.getDate() + 1); }
    if (period === 'week') end.setDate(end.getDate() + 6);
    if (period === 'month') end.setMonth(end.getMonth() + 1, 0);
    const date = new Date(`${b.date}T12:00:00`);
    const matchDate = date >= start && date <= end;
    const matchBarber = barberFilter === 'all' || b.barberId === barberFilter;
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    const query = search.trim().toLocaleLowerCase('pt-BR');
    const matchSearch = !query || `${b.customerName} ${b.customerPhone} ${getServiceName(b.serviceId)}`.toLocaleLowerCase('pt-BR').includes(query);
    return matchDate && matchBarber && matchStatus && matchSearch;
  }).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Agenda Completa</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Consulte períodos e encontre agendamentos específicos
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {([['day','Hoje'],['tomorrow','Amanhã'],['week','Semana'],['month','Mês']] as const).map(([value, label]) => <button key={value} onClick={() => setPeriod(value)} className={`px-3 py-2 rounded-xl text-xs font-bold ${period === value ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{label}</button>)}
          <div className="flex-1 sm:flex-none relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
            />
          </div>
          <select
            value={barberFilter}
            onChange={(e) => setBarberFilter(e.target.value)}
            className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
          >
            <option value="all">Todos os Profissionais</option>
            {barbers.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium bg-white">
            <option value="all">Todos os status</option>
            {['Aguardando pagamento','Confirmado','Em atendimento','Concluído','Cancelado','Não compareceu','Reagendado'].map(status => <option key={status}>{status}</option>)}
          </select>
          <div className="w-full relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Pesquisar cliente, telefone ou serviço" className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm" /></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <CalendarIcon size={18} className="text-indigo-600" />
              Agendamentos do Dia
            </h3>
            <span className="bg-white px-3 py-1 rounded-full text-xs font-bold text-slate-600 border border-slate-200 shadow-sm">
              {filteredBookings.length} {filteredBookings.length === 1 ? 'Agendamento' : 'Agendamentos'}
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto custom-scrollbar">
            {filteredBookings.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <CalendarIcon size={24} className="text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Nenhum agendamento</h3>
                <p className="text-slate-500 text-sm">
                  Não há horários marcados para os filtros selecionados.
                </p>
              </div>
            ) : (
              filteredBookings.map((booking) => (
                <div key={booking.id} className="p-4 sm:p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex flex-col items-center justify-center bg-slate-100 rounded-xl p-3 min-w-[80px]">
                      <span className="text-xl font-black text-slate-900 tracking-tight">{booking.time}</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{new Date(`${booking.date}T12:00:00`).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})}</span>
                    </div>
                    
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-base">{booking.customerName}</h4>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{booking.customerPhone}</p>
                        <div className="mt-2 text-xs font-bold text-indigo-600 bg-indigo-50 inline-block px-2.5 py-1 rounded-md border border-indigo-100">
                          {getServiceName(booking.serviceId)}
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:items-end justify-center gap-2">
                        <div className="text-sm font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm w-fit">
                          👤 {getBarberName(booking.barberId)}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                          booking.status === 'Confirmado' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          booking.status === 'Concluído' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          booking.status === 'Cancelado' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-yellow-50 text-yellow-700 border-yellow-200'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 items-center sm:items-start flex-wrap">
                      <BookingStatusActions booking={booking} handleStatusChange={handleStatusChange} onReschedule={setRescheduling} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
      </div>
      {rescheduling && <AdminRescheduleDialog booking={rescheduling} onClose={() => setRescheduling(null)} showFeedback={showFeedback} />}
    </div>
  );
};
