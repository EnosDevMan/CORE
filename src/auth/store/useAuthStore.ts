import { create } from 'zustand';
import { supabase } from '../../lib/supabaseClient';
import { supabaseAuthProvider } from '../services/supabaseAuthProvider';
import { AuthUser, LoginCredentials, RegisterPayload } from '../types';
import { getErrorMessage } from '../../utils/errors';
import { parseUserRole } from '../authorization';
import {
  clearCapturedPasswordRecoveryIntent,
  clearPasswordRecoveryMarker,
  isCapturedPasswordRecoverySession,
} from '../passwordRecoveryIntent';

interface AuthState {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  /** Erro exclusivo da restauração inicial; nunca é usado para falhas comuns de login/cadastro. */
  initializationError: string | null;
  /**
   * true somente quando o Supabase emite `PASSWORD_RECOVERY` ou quando a
   * sessão restaurada coincide exatamente com os tokens de recovery
   * capturados antes da inicialização do cliente.
   */
  passwordRecoveryMode: boolean;
  initialize: () => () => void;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (payload: RegisterPayload) => Promise<'authenticated' | 'confirmation' | false>;
  logout: () => Promise<void>;
  clearError: () => void;
  completePasswordRecovery: () => void;
}

interface LoadedAuthState {
  user: AuthUser | null;
  recoverySession: boolean;
}

async function loadCurrentUser(): Promise<LoadedAuthState> {
  const { data, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw new Error(sessionError.message);
  if (!data.session) return { user: null, recoverySession: false };

  const recoverySession = isCapturedPasswordRecoverySession(
    data.session.access_token,
    data.session.refresh_token,
  );

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
    return { user: null, recoverySession: false };
  }

  return {
    user: {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: parseUserRole(profile.role),
      phone: profile.phone ?? undefined,
      avatar: profile.avatar ?? undefined,
      profileId: profile.profile_id ?? undefined,
    },
    recoverySession,
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
   * Carrega a sessão atual e escuta mudanças do Supabase. Nenhuma chamada
   * assíncrona ao cliente é iniciada dentro do callback de
   * `onAuthStateChange`: versões do supabase-js podem bloquear o cliente
   * quando outra operação Auth é iniciada antes de o callback retornar.
   */
  initialize: () => {
    let active = true;
    let requestVersion = 0;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    const refreshUser = () => {
      const version = ++requestVersion;
      loadCurrentUser()
        .then(({ user, recoverySession }) => {
          if (active && version === requestVersion) {
            set(state => ({
              currentUser: user,
              isAuthenticated: !!user,
              // Uma vez autenticado como recovery, permaneça nessa tela até
              // conclusão explícita ou SIGNED_OUT. Eventos como USER_UPDATED
              // não devem derrubar a tela no meio da troca de senha.
              passwordRecoveryMode: state.passwordRecoveryMode || recoverySession,
              loading: false,
              error: null,
              initializationError: null,
            }));
          }
        })
        .catch((cause) => {
          if (active && version === requestVersion) {
            set({
              currentUser: null,
              isAuthenticated: false,
              loading: false,
              error: null,
              initializationError: getErrorMessage(cause, 'Não foi possível restaurar sua sessão.'),
            });
          }
        });
    };

    const scheduleRefreshUser = () => {
      if (refreshTimer !== null) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        refreshTimer = null;
        if (active) refreshUser();
      }, 0);
    };

    refreshUser();

    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        requestVersion++;
        if (refreshTimer !== null) {
          clearTimeout(refreshTimer);
          refreshTimer = null;
        }
        clearCapturedPasswordRecoveryIntent();
        if (active) {
          set({
            currentUser: null,
            isAuthenticated: false,
            loading: false,
            error: null,
            initializationError: null,
            passwordRecoveryMode: false,
          });
        }
        return;
      }

      if (event === 'PASSWORD_RECOVERY') {
        if (active) set({ passwordRecoveryMode: true, loading: false, initializationError: null });
      }

      // Deferir é intencional: o callback precisa retornar antes de qualquer
      // nova chamada ao Supabase Auth/Data API.
      scheduleRefreshUser();
    });

    return () => {
      active = false;
      requestVersion++;
      if (refreshTimer !== null) clearTimeout(refreshTimer);
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
      // Se a confirmação de e-mail estiver ativa, o cadastro não gera sessão
      // imediata. O provider também evita consultar profiles antes da sessão.
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
      clearCapturedPasswordRecoveryIntent();
      clearPasswordRecoveryMarker();
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
    clearCapturedPasswordRecoveryIntent();
    clearPasswordRecoveryMarker();
    set({ passwordRecoveryMode: false });
  },
}));
