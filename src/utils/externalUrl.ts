function parseHttpsUrl(value: string): URL {
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error('Informe uma URL válida.');
  }
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new Error('Links externos precisam usar HTTPS e não podem conter credenciais.');
  }
  return url;
}

/** Normalizes an optional external link and rejects unsafe protocols/hosts. */
export function normalizeExternalUrl(value: string | null | undefined, allowedHosts?: readonly string[]): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  const url = parseHttpsUrl(trimmed);
  if (allowedHosts?.length && !allowedHosts.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`))) {
    throw new Error(`O domínio precisa ser ${allowedHosts.join(' ou ')}.`);
  }
  return url.toString();
}

/** Sanitizes persisted legacy values without making the entire app unavailable. */
export function safeExternalUrl(value: string | null | undefined, allowedHosts?: readonly string[]): string | undefined {
  try {
    return normalizeExternalUrl(value, allowedHosts);
  } catch {
    return undefined;
  }
}
