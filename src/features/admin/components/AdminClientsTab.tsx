import React, { useMemo, useState } from 'react';
import { User, Phone, Mail, Calendar as CalendarIcon, Search } from 'lucide-react';
import { useApp } from '../../../store/useApp';
import { isCustomerRole } from '../../../auth/authorization';
import { useNiche } from '../../../core/business/hooks';

interface AdminClientsTabProps {
  formatBRL: (value: number) => string;
}

export const AdminClientsTab: React.FC<AdminClientsTabProps> = ({ formatBRL }) => {
  const { users, bookings } = useApp();
  const niche = useNiche();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = useMemo(() => {
    const search = searchTerm.trim().toLocaleLowerCase('pt-BR');
    return users.filter(client => isCustomerRole(client.role) && (
      client.name.toLocaleLowerCase('pt-BR').includes(search)
      || client.email.toLocaleLowerCase('pt-BR').includes(search)
      || Boolean(client.phone?.includes(searchTerm.trim()))
    ));
  }, [searchTerm, users]);

  const histories = useMemo(() => {
    const summaries = new Map<string, { count: number; totalSpent: number; lastDate: string }>();

    for (const booking of bookings) {
      const summary = summaries.get(booking.customerId) ?? { count: 0, totalSpent: 0, lastDate: '' };
      summary.count += 1;
      if (booking.status === 'Concluído') summary.totalSpent += booking.value;
      if (booking.date > summary.lastDate) summary.lastDate = booking.date;
      summaries.set(booking.customerId, summary);
    }

    return summaries;
  }, [bookings]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">{niche.customerLabel}</h2>
          <p className="text-sm text-slate-500 mt-1">Gerencie a base de {niche.customerLabel.toLocaleLowerCase('pt-BR')} do negócio</p>
        </div>
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, email ou telefone..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-medium text-sm"
          />
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 font-bold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">{niche.customerLabel}</th>
                <th className="px-6 py-4">Contato</th>
                <th className="px-6 py-4">Histórico</th>
                <th className="px-6 py-4 text-right">Valor Gerado</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => {
                const history = histories.get(client.id);

                return (
                  <tr key={client.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{client.name}</span>
                          <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded mt-1 inline-block">
                            {client.createdAt
                              ? `Desde ${new Date(client.createdAt).toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' })}`
                              : 'Data de cadastro indisponível'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-xs">
                        <div className="flex items-center gap-2 text-slate-600"><Mail size={12} className="text-slate-400" />{client.email}</div>
                        {client.phone && <div className="flex items-center gap-2 text-slate-600"><Phone size={12} className="text-slate-400" />{client.phone}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-xs">
                        <div className="flex items-center gap-2 text-slate-700 font-medium"><CalendarIcon size={12} className="text-slate-400" />{history?.count ?? 0} agendamentos</div>
                        {history?.lastDate && <span className="text-[10px] text-slate-500">Último em: {new Date(`${history.lastDate}T12:00:00`).toLocaleDateString('pt-BR')}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right"><span className="font-extrabold text-emerald-600 font-sans block">{formatBRL(history?.totalSpent ?? 0)}</span></td>
                  </tr>
                );
              })}
              {filteredClients.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500"><div className="flex flex-col items-center justify-center"><User size={32} className="text-slate-300 mb-3" /><p className="font-bold text-slate-700">Nenhum cadastro encontrado.</p><p className="text-xs mt-1">Tente buscar com outros termos.</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
