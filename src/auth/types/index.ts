/**
 * Tipos do módulo de autenticação.
 *
 * Estes tipos descrevem o CONTRATO que a futura integração de auth
 * (ex: Supabase Auth) deverá cumprir. Nenhuma implementação concreta
 * existe ainda — apenas as formas de dados e as assinaturas de operação
 * que o restante do app poderá depender de forma estável.
 */

import { UserRole } from '../../types';

/** Usuário autenticado, já resolvido com seu perfil de aplicação. */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  profileId?: string;
}

/** Sessão autenticada (placeholder — formato final depende do provider escolhido). */
export interface AuthSession {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface AuthResult<T = AuthUser> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Contrato que um provedor de autenticação (ex: Supabase) deverá
 * implementar. Nada aqui está implementado — é a interface que a camada
 * `services/` deste módulo vai satisfazer no futuro.
 */
export interface IAuthProvider {
  login(credentials: LoginCredentials): Promise<AuthResult>;
  register(payload: RegisterPayload): Promise<AuthResult>;
  logout(): Promise<void>;
  getSession(): Promise<AuthSession | null>;
  onSessionChange(callback: (session: AuthSession | null) => void): () => void;
  sendPasswordResetEmail(email: string): Promise<AuthResult<void>>;
  updatePassword(newPassword: string): Promise<AuthResult<void>>;
  confirmEmail(token: string): Promise<AuthResult<void>>;
  refreshSession(): Promise<AuthSession | null>;
}
