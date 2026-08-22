import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../../types';

/**
 * HOC de defesa em profundidade por role (RBAC) no nível de componente.
 *
 * Este app NÃO usa react-router (a navegação é feita por estado em
 * `App.tsx`, ver `navigateTo`), então este guard não redireciona rotas —
 * ele apenas evita renderizar o conteúdo protegido se o usuário não tiver
 * a role certa. A blindagem principal (impedir a navegação) já acontece
 * em `App.tsx > navigateTo`; isto aqui é uma segunda camada, útil se o
 * componente for renderizado por outro caminho no futuro.
 *
 * Uso:
 *   export default withRoleGuard(AdminPanel, 'admin');
 *   export default withRoleGuard(ProfessionalDashboard, ['admin', 'barber']);
 */
export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole: UserRole | UserRole[]
): React.FC<P> {
  return function ProtectedComponent(props: P) {
    const { currentUser, loading } = useAuth();
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    if (loading) {
      return (
        <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
          Carregando...
        </div>
      );
    }

    if (!currentUser || !allowedRoles.includes(currentUser.role)) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-center px-6">
          <ShieldAlert size={32} className="text-slate-300" />
          <p className="text-sm text-slate-500">
            Você não tem permissão para acessar esta área.
          </p>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

/**
 * Hook para verificar permissões em qualquer componente (sem HOC) — útil
 * pra esconder/mostrar botões e links condicionalmente.
 */
export function useCanAccess(requiredRole: UserRole | UserRole[]): boolean {
  const { currentUser } = useAuth();
  if (!currentUser) return false;
  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return allowedRoles.includes(currentUser.role);
}
