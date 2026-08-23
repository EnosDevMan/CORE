import { createClient } from '@supabase/supabase-js';
import { resolveSupabaseEnvironment } from '../utils/environment';

const environment = resolveSupabaseEnvironment({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
});

/**
 * Instância única do cliente Supabase, compartilhada entre o módulo de
 * autenticação (`src/auth`) e a camada de acesso a dados
 * (`src/services/dataService.ts`). Nunca crie um segundo cliente — duas
 * instâncias geram avisos de "Multiple GoTrueClient" e podem dessincronizar
 * o estado de sessão.
 */
export const supabase = createClient(environment.url, environment.publishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
