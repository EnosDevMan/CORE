import { describe, expect, it } from 'vitest';
import { parsePasswordRecoveryIntent } from './passwordRecoveryIntent';

describe('parsePasswordRecoveryIntent', () => {
  it('rejects the predictable query marker by itself', () => {
    expect(parsePasswordRecoveryIntent('?password-recovery=1', '')).toBeNull();
  });

  it('rejects a normal authentication fragment even with the marker', () => {
    expect(parsePasswordRecoveryIntent(
      '?password-recovery=1',
      '#type=signup&access_token=access&refresh_token=refresh',
    )).toBeNull();
  });

  it('rejects recovery fragments without both session tokens', () => {
    expect(parsePasswordRecoveryIntent(
      '?password-recovery=1',
      '#type=recovery&access_token=access',
    )).toBeNull();
  });

  it('captures a complete recovery session from the Supabase implicit flow', () => {
    expect(parsePasswordRecoveryIntent(
      '?password-recovery=1',
      '#access_token=access-token&refresh_token=refresh-token&type=recovery&expires_in=3600',
    )).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
  });
});
