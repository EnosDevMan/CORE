import React, { useEffect, useMemo, useState } from 'react';
import { User, Phone, Mail, Calendar as CalendarIcon, Search } from 'lucide-react';
import { useUsers } from '../../../store/useApp';
import { isCustomerRole } from '../../../auth/authorization';
import { useNiche } from '../../../core/business/hooks';
import { adminHistoryService } from '../../../services/adminHistoryService';

interface AdminClientsTabProps {
  formatBRL: (value: number) => string;
}

export const AdminClientsTab: React.FC<AdminClientsTabProps> = ({ formatBRL }) => {
  const users = useUsers();
  const niche = useNiche();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = useMemo(() => {
    const normalizedSearch = searchTerm.trim();
    const search = normalizedSearch.toLocaleLowerCase('pt-BR');
    return users.filter(client => isCustomerRole(client.role) && (
      client.name.toLocaleLowerCase('pt-BR').includes(search)
      || client.email.toLocaleLowerCase('pt-BR').includes(search)
      || Boolean(client.phone?.includes(normalizedSearch))
    ));
  }, [searchTerm, users]);

  const [histories, setHistories] = useState(new Map<string, { count: number; totalSpent: number; lastDate: string }>());
  const [historyError, setHistoryError] = useState('');
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setHistoryLoading(true);
    setHistoryError('');
    void adminHistoryService.loadClientHistorySummaries()
      .then(rows => {
        if (!active) return;
        setHistories(new Map(rows.map(row => [row.customerId, {
          count: row.count,
          totalSpent: row.totalSpent,
          lastDate: row.lastDate,
        }])));
      })
      .catch(error => { if (active) setHistoryError(error instanceof Error ? error.message : 'Não foi possível carregar o histórico dos clientes.'); })
      .finally(() => { if (active) setHistoryLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900">{niche.customerLabel}</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">{filteredClients.length}</span>
          </div>
          <p className="text-sm text-slate-500 mt-1">Consulte contato, histórico e valor gerado por cada cadastro.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar nome, e-mail ou telefone"
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-medium text-sm"
          />
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
        </div>
      </div>

      {historyLoading && <div className="text-sm text-slate-500">Carregando histórico dos clientes...</div>}
      {historyError && <div className="text-sm text-slate-500">{historyError}</div>}

      {filteredClients.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-slate-500 shadow-sm">
          <User size={32} className="text-slate-300 mb-3 mx-auto" />
          <p className="font-bold text-slate-700">Nenhum cadastro encontrado.</p>
          <p className="text-xs mt-1">Tente buscar com outros termos.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 sm:hidden">
            {filteredClients.map(client => {
              const history = histories.get(client.id);
              return (
                <article key={client.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 font-extrabold text-slate-700">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-extrabold text-slate-900">{client.name}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {client.createdAt
                          ? `Cliente desde ${new Date(client.createdAt).toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' })}`
                          : 'Data de cadastro indisponível'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gerado</p>
                      <p className="font-extrabold text-emerald-600">{formatBRL(history?.totalSpent ?? 0)}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
                    <div className="flex items-center gap-2 min-w-0"><Mail size={13} className="shrink-0 text-slate-400" /><span className="truncate">{client.email}</span></div>
                    {client.phone && <div className="flex items-center gap-2"><Phone size={13} className="shrink-0 text-slate-400" />{client.phone}</div>}
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2"><CalendarIcon size={13} className="text-slate-400" />{history?.count ?? 0} agendamento{(history?.count ?? 0) === 1 ? '' : 's'}</span>
                      {history?.lastDate && <span className="text-[11px] text-slate-400">Último: {new Date(`${history.lastDate}T12:00:00`).toLocaleDateString('pt-BR')}</span>}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 font-bold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">{niche.customerLabel}</th>
                    <th className="px-6 py-4">Contato</th>
                    <th className="px-6 py-4">Histórico</th>
                    <th className="px-6 py-4 text-right">Valor gerado</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => {
                    const history = histories.get(client.id);

                    return (
                      <tr key={client.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold">
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
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
