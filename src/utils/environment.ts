export interface SupabaseEnvironmentSource {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  /** @deprecated Migration fallback for installations using legacy API keys. */
  VITE_SUPABASE_ANON_KEY?: string;
}

export interface SupabaseEnvironment {
  url: string;
  publishableKey: string;
}

function requiredString(source: SupabaseEnvironmentSource, keys: (keyof SupabaseEnvironmentSource)[]): string {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  throw new Error(`Configuração técnica ausente: ${keys.join(' ou ')}.`);
}

function validateSupabaseUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('VITE_SUPABASE_URL precisa ser uma URL válida.');
  }
  const localDevelopment = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (url.protocol !== 'https:' && !(localDevelopment && url.protocol === 'http:')) {
    throw new Error('VITE_SUPABASE_URL precisa usar HTTPS fora do desenvolvimento local.');
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error('VITE_SUPABASE_URL não pode conter credenciais, query ou fragmento.');
  }
  return url.toString().replace(/\/$/, '');
}

/** Validates public client configuration before creating any Supabase client. */
export function resolveSupabaseEnvironment(source: SupabaseEnvironmentSource): SupabaseEnvironment {
  const url = validateSupabaseUrl(requiredString(source, ['VITE_SUPABASE_URL']));
  const publishableKey = requiredString(source, [
    'VITE_SUPABASE_PUBLISHABLE_KEY',
    'VITE_SUPABASE_ANON_KEY',
  ]);
  if (/^(sua-|your-|change-me|placeholder)/i.test(publishableKey) || publishableKey.length < 20) {
    throw new Error('A chave pública do Supabase ainda está vazia ou usa um placeholder.');
  }
  return { url, publishableKey };
}

/** Returns a user-facing startup error instead of throwing before React mounts. */
export function getSupabaseConfigError(environment: SupabaseEnvironmentSource): string | null {
  try {
    resolveSupabaseEnvironment(environment);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : 'Configuração técnica do Supabase inválida.';
  }
}
