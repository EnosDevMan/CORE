import { create } from 'zustand';
import { supabase } from '../../lib/supabaseClient';
import { supabaseAuthProvider } from '../services/supabaseAuthProvider';
import { AuthUser, LoginCredentials, RegisterPayload } from '../types';
import { getErrorMessage } from '../../utils/errors';
import { parseUserRole } from '../authorization';

interface AuthState {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  /**
   * true quando o usuário chegou no app através do link de "recuperar
   * senha" por e-mail (evento `PASSWORD_RECOVERY` do Supabase). Enquanto
   * true, a UI deve mostrar a tela de "definir nova senha" em vez do
   * conteúdo normal.
   */
  passwordRecoveryMode: boolean;
  initialize: () => () => void;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (payload: RegisterPayload) => Promise<'authenticated' | 'confirmation' | false>;
  logout: () => Promise<void>;
  completePasswordRecovery: () => void;
}

async function loadCurrentUser(): Promise<AuthUser | null> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, name, role, phone, avatar, profile_id')
    .eq('id', data.session.user.id)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: parseUserRole(profile.role),
    phone: profile.phone ?? undefined,
    avatar: profile.avatar ?? undefined,
    profileId: profile.profile_id ?? undefined,
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  passwordRecoveryMode: false,

  /**
   * Carrega a sessão atual (se houver) e passa a escutar mudanças de sessão
   * (login/logout/expiração de token em outra aba, refresh automático, e
   * o clique no link de recuperação de senha). Chamar uma vez na raiz do
   * app; retorna a função de cleanup.
   */
  initialize: () => {
    let active = true;
    let requestVersion = 0;

    const refreshUser = () => {
      const version = ++requestVersion;
      loadCurrentUser()
        .then(user => {
          if (active && version === requestVersion) {
            set({ currentUser: user, isAuthenticated: !!user, loading: false, error: null });
          }
        })
        .catch(() => {
          if (active && version === requestVersion) {
            set({ currentUser: null, isAuthenticated: false, loading: false });
          }
        });
    };

    refreshUser();

    // Usamos o listener nativo do Supabase (em vez de
    // `supabaseAuthProvider.onSessionChange`) porque precisamos do tipo do
    // evento — especificamente `PASSWORD_RECOVERY`, disparado quando o
    // usuário chega pelo link de e-mail de recuperação de senha.
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        if (active) set({ passwordRecoveryMode: true, loading: false });
        return;
      }
      refreshUser();
    });

    return () => {
      active = false;
      requestVersion++;
      subscription.subscription.unsubscribe();
    };
  },

  login: async (credentials) => {
    set({ loading: true, error: null });
    try {
      const result = await supabaseAuthProvider.login(credentials);
      if (!result.success || !result.data) {
        set({ loading: false, error: result.error || 'Falha ao entrar.' });
        return false;
      }
      set({ currentUser: result.data, isAuthenticated: true, loading: false, error: null });
      return true;
    } catch (err) {
      set({ loading: false, error: getErrorMessage(err, 'Falha ao entrar. Tente novamente.') });
      return false;
    }
  },

  register: async (payload) => {
    set({ loading: true, error: null });
    try {
      const result = await supabaseAuthProvider.register(payload);
      if (!result.success) {
        set({ loading: false, error: result.error || 'Falha ao criar conta.' });
        return false;
      }
      // Se a confirmação de e-mail estiver ativa no projeto Supabase, o
      // cadastro não gera sessão imediata — só marcamos como autenticado se
      // existir uma sessão de verdade.
      const session = await supabaseAuthProvider.getSession();
      set({
        currentUser: session ? result.data ?? null : null,
        isAuthenticated: !!session && !!result.data,
        loading: false,
        error: null,
      });
      return session && result.data ? 'authenticated' : 'confirmation';
    } catch (err) {
      set({ loading: false, error: getErrorMessage(err, 'Falha ao criar conta. Tente novamente.') });
      return false;
    }
  },

  logout: async () => {
    try {
      await supabaseAuthProvider.logout();
    } finally {
      // A sessão visual nunca deve permanecer ativa quando o usuário pediu
      // para sair, mesmo se a revogação remota falhar por falta de rede.
      set({ currentUser: null, isAuthenticated: false, loading: false, error: null });
    }
  },

  completePasswordRecovery: () => set({ passwordRecoveryMode: false }),
}));
