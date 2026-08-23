/**
 * Returns the decoded object path from a public Supabase Storage URL.
 * This parser is intentionally independent from the Supabase client so it can
 * be reused and tested without requiring deployment credentials.
 */
export function getPublicStoragePath(publicUrl: string, bucket: string): string {
  const url = new URL(publicUrl);
  const marker = `/storage/v1/object/public/${encodeURIComponent(bucket)}/`;

  if (!url.pathname.startsWith(marker)) {
    throw new Error(`A URL não pertence ao bucket ${bucket}.`);
  }

  const encodedPath = url.pathname.slice(marker.length);
  const path = decodeURIComponent(encodedPath);
  const segments = path.split('/');

  if (!path || segments.some(segment => segment === '..' || segment === '.')) {
    throw new Error('O caminho público do arquivo é inválido.');
  }

  return path;
}

