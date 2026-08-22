import { describe, expect, it } from 'vitest';
import { getSupabaseConfigError, resolveSupabaseEnvironment } from './environment';

const validKey = `sb_publishable_${'x'.repeat(32)}`;
const validEnvironment = {
  VITE_SUPABASE_URL: 'https://meu-projeto.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: validKey,
};

describe('Supabase environment', () => {
  it('accepts and normalizes the current publishable key contract', () => {
    expect(resolveSupabaseEnvironment({ ...validEnvironment, VITE_SUPABASE_URL: `${validEnvironment.VITE_SUPABASE_URL}/` }))
      .toEqual({ url: validEnvironment.VITE_SUPABASE_URL, publishableKey: validKey });
    expect(getSupabaseConfigError(validEnvironment)).toBeNull();
  });

  it('keeps the legacy anonymous key as a migration fallback', () => {
    expect(resolveSupabaseEnvironment({
      VITE_SUPABASE_URL: 'http://localhost:54321',
      VITE_SUPABASE_ANON_KEY: 'legacy-public-key-that-is-long-enough',
    }).publishableKey).toContain('legacy');
  });

  it.each([
    [{ VITE_SUPABASE_PUBLISHABLE_KEY: validKey }, 'VITE_SUPABASE_URL'],
    [{ VITE_SUPABASE_URL: 'not-a-url', VITE_SUPABASE_PUBLISHABLE_KEY: validKey }, 'URL válida'],
    [{ VITE_SUPABASE_URL: 'http://project.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: validKey }, 'HTTPS'],
    [{ VITE_SUPABASE_URL: 'https://user:pass@project.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: validKey }, 'credenciais'],
    [{ VITE_SUPABASE_URL: 'https://project.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sua-chave' }, 'placeholder'],
  ])('fails closed for invalid technical configuration', (source, message) => {
    expect(() => resolveSupabaseEnvironment(source)).toThrow(message);
    expect(getSupabaseConfigError(source)).toContain(message);
  });
});
