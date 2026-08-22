/**
 * Extrai uma mensagem de erro legível de um `unknown` (o tipo real de
 * qualquer valor capturado em `catch`), com um fallback caso não seja
 * possível extrair nada útil.
 *
 * Usar sempre `catch (err) { getErrorMessage(err, '...') }` em vez de
 * `catch (err: any) { err.message }` — evita assumir a forma do erro.
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string' && err) return err;
  return fallback;
}
