import { useMemo, useState } from 'react';
import { Loader2, Search, ShieldCheck, Trash2, UserRound } from 'lucide-react';
import { getRoleLabel, isAdministratorRole, isProfessionalRole } from '../../../auth/authorization';
import { useCurrentUser, useDeleteUserAccount, useUpdateUserRole, useUsers } from '../../../store/useApp';
import { getErrorMessage } from '../../../utils/errors';
import type { User } from '../../../types';

interface AdminAccountsTabProps {
  showFeedback: (message: string, isError?: boolean) => void;
}

/** Owner-only screen; database policies remain the actual security boundary. */
export function AdminAccountsTab({ showFeedback }: AdminAccountsTabProps) {
  const users = useUsers();
  const currentUser = useCurrentUser();
  const updateUserRole = useUpdateUserRole();
  const deleteUserAccount = useDeleteUserAccount();
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingAccountId, setPendingAccountId] = useState<string | null>(null);

  const accounts = useMemo(() => {
    const search = searchTerm.trim().toLocaleLowerCase('pt-BR');

    return users.filter(account => {
      if (account.id === currentUser?.id || isAdministratorRole(account.role)) return false;
      if (!search) return true;
      return [account.name, account.email, account.phone ?? '', getRoleLabel(account.role)]
        .some(value => value.toLocaleLowerCase('pt-BR').includes(search));
    });
  }, [currentUser?.id, searchTerm, users]);

  const handleRoleChange = async (account: User, role: 'customer' | 'professional') => {
    if (pendingAccountId || account.role === role) return;
    setPendingAccountId(account.id);

    try {
      await updateUserRole(account.id, role);
      showFeedback(`Conta de ${account.name} atualizada para ${getRoleLabel(role).toLowerCase()}.`);
    } catch (error) {
      showFeedback(getErrorMessage(error, 'Não foi possível alterar o papel da conta.'), true);
    } finally {
      setPendingAccountId(null);
    }
  };

  const handleDelete = async (account: User) => {
    if (pendingAccountId) return;
    const confirmed = window.confirm(
      `Excluir permanentemente a conta de ${account.name} (${account.email})? `
      + 'O login e as sessões serão removidos. O histórico de agendamentos será preservado.',
    );
    if (!confirmed) return;

    setPendingAccountId(account.id);
    try {
      await deleteUserAccount(account.id);
      showFeedback(`Conta de ${account.name} excluída com segurança.`);
    } catch (error) {
      showFeedback(getErrorMessage(error, 'Não foi possível excluir a conta.'), true);
    } finally {
      setPendingAccountId(null);
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <ShieldCheck size={20} /> Contas e acessos
            </h3>
            <p className="mt-1 max-w-xl text-sm text-slate-500">
              Promova clientes para profissionais, revise acessos e remova contas sem apagar o histórico.
              A conta proprietária permanece protegida.
            </p>
          </div>
          <label className="relative w-full sm:w-72">
            <span className="sr-only">Buscar contas</span>
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              placeholder="Buscar nome, e-mail ou papel"
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm focus:border-slate-900 focus:outline-none"
            />
          </label>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {accounts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-12 text-center text-slate-500">
            <UserRound size={28} className="text-slate-300" />
            <p className="font-medium">Nenhuma conta disponível para gerenciamento.</p>
          </div>
        ) : accounts.map(account => {
          const pending = pendingAccountId === account.id;
          const assignableRole = account.role === 'customer' || isProfessionalRole(account.role);

          return (
            <div key={account.id} className="flex flex-col gap-4 border-b border-slate-100 p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">{account.name}</p>
                <p className="truncate text-sm text-slate-500">{account.email}</p>
                {account.profileId && (
                  <p className="mt-1 text-xs font-medium text-amber-700">Vinculada a uma agenda profissional.</p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {assignableRole ? (
                  <label>
                    <span className="sr-only">Papel de {account.name}</span>
                    <select
                      value={isProfessionalRole(account.role) ? 'professional' : 'customer'}
                      disabled={pendingAccountId !== null}
                      onChange={event => {
                        const role = event.target.value;
                        if (role === 'customer' || role === 'professional') {
                          void handleRoleChange(account, role);
                        }
                      }}
                      className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="customer" disabled={Boolean(account.profileId)}>Cliente</option>
                      <option value="professional">Profissional</option>
                    </select>
                  </label>
                ) : (
                  <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
                    {getRoleLabel(account.role)}
                  </span>
                )}

                <button
                  type="button"
                  disabled={pendingAccountId !== null}
                  onClick={() => void handleDelete(account)}
                  aria-label={`Excluir conta de ${account.name}`}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-rose-200 px-3 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pending ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  Excluir
                </button>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
