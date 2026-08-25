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
import { getPasswordRecoveryRedirectUrl } from '../passwordRecoveryIntent';
import { PRIVACY_POLICY_VERSION } from '../../legal';

/**
 * Implementação de IAuthProvider usando Supabase Auth + tabela `profiles`.
 *
 * `profiles` é criada automaticamente (trigger `handle_new_user`, ver
 * `supabase/schema.sql`) quando um usuário se cadastra — sempre com role
 * 'customer'. Promoção para owner/professional é feita pelo fluxo
 * administrativo protegido no banco.
 */
async function fetchProfile(userId: string): Promise<AuthUser | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, name, role, phone, avatar, profile_id')
    .eq('id', userId)
    .maybeSingle();

  // Diferencie "perfil ausente" de falha de rede/RLS. Tratar todo erro como
  // ausência escondia a causa real e podia provocar logout indevido.
  if (error) throw new Error(error.message);
  if (!data) return null;

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

async function signOutCurrentSession(): Promise<void> {
  await supabase.auth.signOut({ scope: 'local' });
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

    let profile: AuthUser | null;
    try {
      profile = await fetchProfile(data.user.id);
    } catch {
      // O login Auth já criou uma sessão. Se a aplicação não consegue
      // validar o perfil, remova somente ESTA sessão para não deixar um
      // usuário autenticado invisível nem derrubar outros dispositivos.
      await signOutCurrentSession();
      return { success: false, error: 'Login confirmado, mas não foi possível carregar seu perfil. Tente novamente.' };
    }

    if (!profile) {
      await signOutCurrentSession();
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

    // Com confirmação de e-mail habilitada, signup retorna usuário sem sessão.
    // Consultar `profiles` nesse momento falha por RLS e não significa que o
    // trigger de criação do perfil falhou.
    if (!data.session) return { success: true };

    try {
      const profile = await fetchProfile(data.user.id);
      if (!profile) {
        await signOutCurrentSession();
        return { success: false, error: 'Conta criada, mas o perfil do usuário não foi encontrado.' };
      }
      return { success: true, data: profile };
    } catch {
      await signOutCurrentSession();
      return { success: false, error: 'Conta criada, mas não foi possível carregar seu perfil. Tente entrar novamente.' };
    }
  },

  async logout(): Promise<void> {
    // "Sair" encerra apenas a sessão atual. O padrão do supabase-js é
    // `global`, que também revoga as sessões do usuário em outros aparelhos.
    await signOutCurrentSession();
  },

  async getSession(): Promise<AuthSession | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw new Error(error.message);
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
      redirectTo: getPasswordRecoveryRedirectUrl(window.location.origin),
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
    const { data, error } = await supabase.auth.getSession();
    if (error) return { success: false, error: error.message };
    return data.session ? { success: true } : { success: false, error: 'Sessão não encontrada.' };
  },

  async refreshSession(): Promise<AuthSession | null> {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session) return null;
    return toAuthSession(data.session);
  },
};
