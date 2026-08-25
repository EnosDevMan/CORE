import { supabase } from '../../lib/supabaseClient';
import {
  AuthResult,
  AuthSession,
  AuthUser,
  IAuthProvider,
  LoginCredentials,
  RegisterPayload,
} from '../types';
import { parseUserRole } from '../authorization';
import { PRIVACY_POLICY_VERSION } from '../../legal';

/**
 * Implementação de IAuthProvider usando Supabase Auth + tabela `profiles`.
 *
 * `profiles` é criada automaticamente (trigger `handle_new_user`, ver
 * `supabase/schema.sql`) quando um usuário se
 * cadastra — sempre com role 'customer'. Promoção para owner/professional é
 * feita manualmente pelo painel administrativo ou direto no banco.
 */
async function fetchProfile(userId: string): Promise<AuthUser | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, name, role, phone, avatar, profile_id')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    role: parseUserRole(data.role),
    phone: data.phone ?? undefined,
    avatar: data.avatar ?? undefined,
    profileId: data.profile_id ?? undefined,
  };
}

function toAuthSession(session: NonNullable<Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']>): AuthSession {
  return {
    userId: session.user.id,
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: (session.expires_at ?? 0) * 1000,
  };
}

function getPasswordRecoveryRedirectUrl(): string {
  const url = new URL(window.location.origin);
  url.searchParams.set('password-recovery', '1');
  return url.toString();
}

export const supabaseAuthProvider: IAuthProvider = {
  async login({ email, password, captchaToken }: LoginCredentials): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
      options: { captchaToken },
    });
    if (error || !data.user) {
      return { success: false, error: error?.message || 'Não foi possível entrar. Verifique seus dados.' };
    }
    const profile = await fetchProfile(data.user.id);
    if (!profile) {
      await supabase.auth.signOut();
      return { success: false, error: 'Login realizado, mas o perfil do usuário não foi encontrado.' };
    }
    return { success: true, data: profile };
  },

  async register({ name, email, phone, password, captchaToken }: RegisterPayload): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        captchaToken,
        data: { name: name.trim(), phone: phone.trim(), privacy_policy_version: PRIVACY_POLICY_VERSION },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error || !data.user) {
      return { success: false, error: error?.message || 'Não foi possível criar sua conta.' };
    }
    const profile = await fetchProfile(data.user.id);
    return { success: true, data: profile ?? undefined };
  },

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  },

  async getSession(): Promise<AuthSession | null> {
    const { data } = await supabase.auth.getSession();
    return data.session ? toAuthSession(data.session) : null;
  },

  onSessionChange(callback: (session: AuthSession | null) => void): () => void {
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session ? toAuthSession(session) : null);
    });
    return () => subscription.subscription.unsubscribe();
  },

  async sendPasswordResetEmail(email: string, captchaToken?: string): Promise<AuthResult<void>> {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      // O link precisa voltar para um estado identificável da aplicação. O
      // evento PASSWORD_RECOVERY continua sendo a fonte principal, mas o
      // marcador também permite recuperar a tela correta se o listener for
      // registrado depois de o SDK já ter processado a sessão da URL.
      redirectTo: getPasswordRecoveryRedirectUrl(),
      captchaToken,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  async updatePassword(newPassword: string): Promise<AuthResult<void>> {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  async confirmEmail(_token: string): Promise<AuthResult<void>> {
    const { data } = await supabase.auth.getSession();
    return data.session ? { success: true } : { success: false, error: 'Sessão não encontrada.' };
  },

  async refreshSession(): Promise<AuthSession | null> {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session) return null;
    return toAuthSession(data.session);
  },
};
