import { supabase } from '../../lib/supabaseClient';
import {
  AuthResult,
  AuthSession,
  AuthUser,
  IAuthProvider,
  LoginCredentials,
  RegisterPayload,
} from '../types';

/**
 * Implementação de IAuthProvider usando Supabase Auth + tabela `profiles`.
 *
 * `profiles` é criada automaticamente (trigger `handle_new_user`, ver
 * `supabase/migrations/0001_initial_schema.sql`) quando um usuário se
 * cadastra — sempre com role 'customer'. Promoção para 'admin'/'barber' é
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
    role: data.role,
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

export const supabaseAuthProvider: IAuthProvider = {
  async login({ email, password }: LoginCredentials): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      return { success: false, error: error?.message || 'Não foi possível entrar. Verifique seus dados.' };
    }
    const profile = await fetchProfile(data.user.id);
    if (!profile) {
      return { success: false, error: 'Login realizado, mas o perfil do usuário não foi encontrado.' };
    }
    return { success: true, data: profile };
  },

  async register({ name, email, phone, password }: RegisterPayload): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone },
        // Sem isto, o link de confirmação por e-mail usa o "Site URL"
        // configurado no painel do Supabase (Authentication > URL
        // Configuration) — que por padrão, num projeto novo, aponta para
        // localhost. Passar explicitamente a origem atual da página evita
        // depender de lembrar de atualizar aquela configuração. Ainda
        // assim, o domínio de produção precisa estar na lista "Redirect
        // URLs" do mesmo painel, ou o Supabase rejeita o redirecionamento.
        emailRedirectTo: window.location.origin,
      },
    });
    if (error || !data.user) {
      return { success: false, error: error?.message || 'Não foi possível criar sua conta.' };
    }
    // O trigger `handle_new_user` cria o profile de forma assíncrona; se a
    // confirmação por e-mail estiver ativa, ainda não há sessão aqui.
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

  async sendPasswordResetEmail(email: string): Promise<AuthResult<void>> {
    // Mesmo raciocínio do emailRedirectTo em `register` acima: evita
    // depender só do "Site URL" do painel do Supabase.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
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
    // O Supabase confirma o e-mail via redirect próprio (link enviado por
    // e-mail já autentica a sessão); nada a fazer aqui além de checar sessão.
    const { data } = await supabase.auth.getSession();
    return data.session ? { success: true } : { success: false, error: 'Sessão não encontrada.' };
  },

  async refreshSession(): Promise<AuthSession | null> {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session) return null;
    return toAuthSession(data.session);
  },
};
