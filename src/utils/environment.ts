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

function validatePublicSupabaseKey(value: string): string {
  if (/^(sua-|your-|change-me|placeholder)/i.test(value) || value.length < 20) {
    throw new Error('A chave pública do Supabase ainda está vazia ou usa um placeholder.');
  }

  if (value.startsWith('sb_publishable_')) return value;

  if (/^sb_secret_/i.test(value)) {
    throw new Error('Uma chave secreta do Supabase nunca pode ser enviada ao navegador.');
  }

  const segments = value.split('.');
  if (segments.length !== 3) {
    throw new Error('Use uma chave sb_publishable_ ou um JWT legado com role anon.');
  }

  let payload: unknown;
  try {
    const normalized = segments[1].replace(/-/g, '+').replace(/_/g, '/');
    payload = JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')));
  } catch {
    throw new Error('O JWT legado do Supabase possui um payload inválido.');
  }

  if (!payload || typeof payload !== 'object' || !('role' in payload) || payload.role !== 'anon') {
    throw new Error('Somente a role anon pode ser utilizada no navegador; service_role é proibida.');
  }

  return value;
}

/** Validates public client configuration before creating any Supabase client. */
export function resolveSupabaseEnvironment(source: SupabaseEnvironmentSource): SupabaseEnvironment {
  const url = validateSupabaseUrl(requiredString(source, ['VITE_SUPABASE_URL']));
  const publishableKey = validatePublicSupabaseKey(requiredString(source, [
    'VITE_SUPABASE_PUBLISHABLE_KEY',
    'VITE_SUPABASE_ANON_KEY',
  ]));
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
