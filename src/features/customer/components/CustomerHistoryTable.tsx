import React from 'react';
import { Calendar, Scissors, User } from 'lucide-react';
import { Booking } from '../../../types';

interface CustomerHistoryTableProps {
  pastBookings: Booking[];
  getServiceName: (id: string) => string;
  getProfessionalName: (id: string) => string;
  formatBRL: (val: number) => string;
  getStatusBadge: (status: string) => React.ReactNode;
}

export const CustomerHistoryTable: React.FC<CustomerHistoryTableProps> = ({
  pastBookings,
  getServiceName,
  getProfessionalName,
  formatBRL,
  getStatusBadge
}) => {
  if (pastBookings.length === 0) {
    return (
      <div className="bg-slate-50 rounded-2xl p-8 text-center text-slate-400 border border-slate-100">
        Nenhuma visita finalizada registrada ainda.
      </div>
    );
  }

  return (
    <>
      {/* Celular/tablet estreito: lista de cards (mesmo estilo visual do
          BookingCard usado nos agendamentos futuros) — uma tabela de 5
          colunas com texto pequeno ficava apertada demais para ler ou tocar
          confortavelmente numa tela de celular. */}
      <div className="space-y-3 md:hidden">
        {pastBookings.map(booking => (
          <div key={booking.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="bg-slate-50 text-slate-700 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-slate-100">
                  <Scissors size={16} />
                </div>
                <div className="min-w-0">
                  <p className="font-extrabold text-slate-900 text-sm leading-tight truncate">{getServiceName(booking.serviceId)}</p>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mt-1">
                    <User size={11} className="text-slate-400 shrink-0" />
                    <span className="truncate">{getProfessionalName(booking.professionalId)}</span>
                  </div>
                </div>
              </div>
              <div className="shrink-0">{getStatusBadge(booking.status)}</div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Calendar size={11} className="text-slate-400" />
                {new Date(booking.date + "T12:00:00").toLocaleDateString('pt-BR')} às {booking.time}h
              </div>
              <span className="font-extrabold text-slate-900 text-sm">{formatBRL(booking.value)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tablet largo/desktop: tabela tradicional */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="py-3 px-6 font-bold">Serviço</th>
                <th className="py-3 px-6 font-bold">Profissional</th>
                <th className="py-3 px-6 font-bold">Data / Hora</th>
                <th className="py-3 px-6 font-bold text-right">Valor</th>
                <th className="py-3 px-6 text-right font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pastBookings.map(booking => (
                <tr key={booking.id} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-6 font-bold text-slate-900">{getServiceName(booking.serviceId)}</td>
                  <td className="py-3.5 px-6 font-medium">{getProfessionalName(booking.professionalId)}</td>
                  <td className="py-3.5 px-6 whitespace-nowrap">{new Date(booking.date + "T12:00:00").toLocaleDateString('pt-BR')} às {booking.time}h</td>
                  <td className="py-3.5 px-6 text-right font-bold text-slate-900">{formatBRL(booking.value)}</td>
                  <td className="py-3.5 px-6 text-right">{getStatusBadge(booking.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
