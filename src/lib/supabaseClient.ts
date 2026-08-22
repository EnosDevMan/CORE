import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias. ' +
    'Copie .env.example para .env.local e preencha com os dados do seu projeto Supabase.'
  );
}

/**
 * Instância única do cliente Supabase, compartilhada entre o módulo de
 * autenticação (`src/auth`) e a camada de acesso a dados
 * (`src/services/dataService.ts`). Nunca crie um segundo cliente — duas
 * instâncias geram avisos de "Multiple GoTrueClient" e podem dessincronizar
 * o estado de sessão.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
