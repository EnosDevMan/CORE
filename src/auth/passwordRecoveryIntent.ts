export const PASSWORD_RECOVERY_PARAM = 'password-recovery';

export interface PasswordRecoveryIntent {
  accessToken: string;
  refreshToken: string;
}

let capturedIntent: PasswordRecoveryIntent | null = null;

/**
 * Extrai a evidência do fluxo implicit de recuperação antes de o cliente
 * Supabase processar e limpar o fragmento da URL. O marcador na query string
 * sozinho nunca é considerado prova de recuperação.
 */
export function parsePasswordRecoveryIntent(search: string, hash: string): PasswordRecoveryIntent | null {
  const query = new URLSearchParams(search);
  if (query.get(PASSWORD_RECOVERY_PARAM) !== '1') return null;

  const fragment = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
  if (fragment.get('type') !== 'recovery') return null;

  const accessToken = fragment.get('access_token');
  const refreshToken = fragment.get('refresh_token');
  if (!accessToken || !refreshToken) return null;

  return { accessToken, refreshToken };
}

/** Deve ser chamado antes de importar qualquer módulo que crie o cliente Supabase. */
export function capturePasswordRecoveryIntent(): void {
  capturedIntent = parsePasswordRecoveryIntent(window.location.search, window.location.hash);
}

/**
 * O fallback só é aceito se a sessão que o SDK restaurou for exatamente a
 * sessão entregue pelo link de recuperação capturado antes da inicialização.
 */
export function isCapturedPasswordRecoverySession(accessToken: string, refreshToken: string): boolean {
  return capturedIntent !== null
    && capturedIntent.accessToken === accessToken
    && capturedIntent.refreshToken === refreshToken;
}

export function clearCapturedPasswordRecoveryIntent(): void {
  capturedIntent = null;
}

export function getPasswordRecoveryRedirectUrl(origin: string): string {
  const url = new URL(origin);
  url.searchParams.set(PASSWORD_RECOVERY_PARAM, '1');
  return url.toString();
}

export function clearPasswordRecoveryMarker(): void {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(PASSWORD_RECOVERY_PARAM)) return;

  url.searchParams.delete(PASSWORD_RECOVERY_PARAM);
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
}
