import { create } from 'zustand';
import { supabase } from '../../lib/supabaseClient';
import { supabaseAuthProvider } from '../services/supabaseAuthProvider';
import { AuthUser, LoginCredentials, RegisterPayload } from '../types';
import { getErrorMessage } from '../../utils/errors';
import { parseUserRole } from '../authorization';

const PASSWORD_RECOVERY_PARAM = 'password-recovery';

function hasPasswordRecoveryMarker(): boolean {
  return new URLSearchParams(window.location.search).get(PASSWORD_RECOVERY_PARAM) === '1';
}

function clearPasswordRecoveryMarker(): void {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(PASSWORD_RECOVERY_PARAM)) return;

  url.searchParams.delete(PASSWORD_RECOVERY_PARAM);
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
}

interface AuthState {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  /** Erro exclusivo da restauração inicial; nunca é usado para falhas comuns de login/cadastro. */
  initializationError: string | null;
  /**
   * true quando o usuário chegou no app através do link de "recuperar
   * senha" por e-mail. O evento `PASSWORD_RECOVERY` é a fonte principal;
   * um marcador explícito na URL serve de fallback caso o SDK processe o
   * link antes de o listener da aplicação ser registrado.
   */
  passwordRecoveryMode: boolean;
  initialize: () => () => void;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (payload: RegisterPayload) => Promise<'authenticated' | 'confirmation' | false>;
  logout: () => Promise<void>;
  clearError: () => void;
  completePasswordRecovery: () => void;
}

async function loadCurrentUser(): Promise<AuthUser | null> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, email, name, role, phone, avatar, profile_id')
    .eq('id', data.session.user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!profile) {
    // Evita uma sessão Auth ativa que a UI trataria como visitante. Esse
    // estado impede o agendamento anônimo, pois auth.uid() continua definido.
    await supabase.auth.signOut({ scope: 'local' });
    return null;
  }

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
  initializationError: null,
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
    const recoveryMarkerPresent = hasPasswordRecoveryMarker();

    const refreshUser = () => {
      const version = ++requestVersion;
      loadCurrentUser()
        .then(user => {
          if (active && version === requestVersion) {
            set({
              currentUser: user,
              isAuthenticated: !!user,
              // O marcador só ativa o fallback se uma sessão válida tiver
              // sido restaurada. Assim, acrescentar ?password-recovery=1
              // manualmente não cria uma falsa tela funcional de troca.
              passwordRecoveryMode: recoveryMarkerPresent && !!user,
              loading: false,
              error: null,
              initializationError: null,
            });
          }
        })
        .catch((cause) => {
          if (active && version === requestVersion) {
            set({
              currentUser: null,
              isAuthenticated: false,
              passwordRecoveryMode: false,
              loading: false,
              error: null,
              initializationError: getErrorMessage(cause, 'Não foi possível restaurar sua sessão.'),
            });
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
        if (active) set({ passwordRecoveryMode: true, loading: false, initializationError: null });
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
    set({ loading: true, error: null, initializationError: null });
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
    set({ loading: true, error: null, initializationError: null });
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
      set({
        currentUser: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        initializationError: null,
        passwordRecoveryMode: false,
      });
    }
  },

  clearError: () => set({ error: null }),
  completePasswordRecovery: () => {
    clearPasswordRecoveryMarker();
    set({ passwordRecoveryMode: false });
  },
}));
