import { describe, expect, it } from 'vitest';
import { getPasswordValidationError, MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from './passwordPolicy';

describe('shared production password policy', () => {
  it('rejects passwords below the Supabase-recommended minimum', () => {
    expect(getPasswordValidationError('a'.repeat(MIN_PASSWORD_LENGTH - 1)))
      .toBe('A senha precisa ter entre 8 e 128 caracteres.');
  });

  it('accepts both inclusive boundaries', () => {
    expect(getPasswordValidationError('a'.repeat(MIN_PASSWORD_LENGTH))).toBeNull();
    expect(getPasswordValidationError('a'.repeat(MAX_PASSWORD_LENGTH))).toBeNull();
  });

  it('rejects excessively large credentials', () => {
    expect(getPasswordValidationError('a'.repeat(MAX_PASSWORD_LENGTH + 1)))
      .toBe('A senha precisa ter entre 8 e 128 caracteres.');
  });
});
