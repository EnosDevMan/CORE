/**
 * Tipos do módulo de autenticação.
 *
 * Contrato estável entre a UI e a implementação atual de Supabase Auth.
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

/** Projeção mínima da sessão usada pela aplicação. */
export interface AuthSession {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
  captchaToken?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  captchaToken?: string;
}

export interface AuthResult<T = AuthUser> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Contrato implementado pela camada `auth/services`, mantendo componentes
 * desacoplados dos detalhes do SDK do provedor.
 */
export interface IAuthProvider {
  login(credentials: LoginCredentials): Promise<AuthResult>;
  register(payload: RegisterPayload): Promise<AuthResult>;
  logout(): Promise<void>;
  getSession(): Promise<AuthSession | null>;
  onSessionChange(callback: (session: AuthSession | null) => void): () => void;
  sendPasswordResetEmail(email: string, captchaToken?: string): Promise<AuthResult<void>>;
  updatePassword(newPassword: string): Promise<AuthResult<void>>;
  confirmEmail(token: string): Promise<AuthResult<void>>;
  refreshSession(): Promise<AuthSession | null>;
}
