const PLACEHOLDER_PROJECT = 'SEU_PROJETO';
const PLACEHOLDER_KEY = 'sua-anon-key-publica';

export interface SupabaseEnvironment {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
}

export function getSupabaseConfigError(environment: SupabaseEnvironment): string | null {
  const url = environment.VITE_SUPABASE_URL?.trim();
  const anonKey = environment.VITE_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    return 'As variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não estão disponíveis.';
  }

  if (url.includes(PLACEHOLDER_PROJECT) || anonKey === PLACEHOLDER_KEY) {
    return 'As variáveis do Supabase ainda contêm os valores de exemplo.';
  }

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'https:' || !parsedUrl.hostname.endsWith('.supabase.co')) {
      return 'VITE_SUPABASE_URL precisa ser uma URL HTTPS válida do Supabase.';
    }
  } catch {
    return 'VITE_SUPABASE_URL precisa ser uma URL HTTPS válida do Supabase.';
  }

  return null;
}
