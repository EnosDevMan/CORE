import { describe, expect, it } from 'vitest';
import { getSupabaseConfigError, resolveSupabaseEnvironment } from './environment';

const validKey = `sb_publishable_${'x'.repeat(32)}`;
const validEnvironment = {
  VITE_SUPABASE_URL: 'https://meu-projeto.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: validKey,
};

const legacyJwt = (role: string): string => {
  const encode = (value: object) => btoa(JSON.stringify(value))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ role })}.test-signature`;
};

describe('Supabase environment', () => {
  it('accepts and normalizes the current publishable key contract', () => {
    expect(resolveSupabaseEnvironment({ ...validEnvironment, VITE_SUPABASE_URL: `${validEnvironment.VITE_SUPABASE_URL}/` }))
      .toEqual({ url: validEnvironment.VITE_SUPABASE_URL, publishableKey: validKey });
    expect(getSupabaseConfigError(validEnvironment)).toBeNull();
  });

  it('keeps the legacy anonymous key as a migration fallback', () => {
    const anonymousKey = legacyJwt('anon');
    expect(resolveSupabaseEnvironment({
      VITE_SUPABASE_URL: 'http://localhost:54321',
      VITE_SUPABASE_ANON_KEY: anonymousKey,
    }).publishableKey).toBe(anonymousKey);
  });

  it.each([
    [`sb_secret_${'x'.repeat(32)}`, 'chave secreta'],
    [legacyJwt('service_role'), 'service_role'],
    [legacyJwt('supabase_admin'), 'role anon'],
    ['not-a-public-key-but-long-enough', 'sb_publishable_'],
    ['header.not-valid-json.signature', 'payload inválido'],
  ])('rejects credentials that cannot be exposed in the browser', (key, message) => {
    const source = { ...validEnvironment, VITE_SUPABASE_PUBLISHABLE_KEY: key };
    expect(() => resolveSupabaseEnvironment(source)).toThrow(message);
    expect(getSupabaseConfigError(source)).toContain(message);
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
