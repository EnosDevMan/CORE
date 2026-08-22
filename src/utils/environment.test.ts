import { describe, expect, it } from 'vitest';
import { getSupabaseConfigError } from './environment';

const validEnvironment = {
  VITE_SUPABASE_URL: 'https://meu-projeto.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'chave-publica',
};

describe('getSupabaseConfigError', () => {
  it('accepts a complete Supabase environment', () => {
    expect(getSupabaseConfigError(validEnvironment)).toBeNull();
  });

  it('rejects missing and blank variables', () => {
    expect(getSupabaseConfigError({})).toContain('não estão disponíveis');
    expect(getSupabaseConfigError({ ...validEnvironment, VITE_SUPABASE_ANON_KEY: '  ' })).toContain(
      'não estão disponíveis',
    );
  });

  it('rejects the values copied unchanged from .env.example', () => {
    expect(
      getSupabaseConfigError({
        VITE_SUPABASE_URL: 'https://SEU_PROJETO.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'sua-anon-key-publica',
      }),
    ).toContain('valores de exemplo');
  });

  it.each(['not-a-url', 'http://meu-projeto.supabase.co', 'https://example.com'])(
    'rejects an invalid Supabase URL: %s',
    (url) => {
      expect(getSupabaseConfigError({ ...validEnvironment, VITE_SUPABASE_URL: url })).toContain(
        'URL HTTPS válida',
      );
    },
  );
});
