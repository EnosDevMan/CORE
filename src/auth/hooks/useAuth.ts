import { useAuthStore } from '../store/useAuthStore';

/**
 * Ponto único de acesso ao estado de autenticação a partir da UI.
 *
 * Hoje apenas repassa o estado mínimo do `useAuthStore` (ver ali o motivo).
 * No futuro, este hook pode passar a orquestrar chamadas para
 * `auth/services` (login, cadastro, logout, recuperação de senha, etc.)
 * sem que os componentes que o consomem precisem mudar.
 */
export const useAuth = () => useAuthStore();
