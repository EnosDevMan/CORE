import { describe, expect, it } from 'vitest';
import { getPublicStoragePath, validateStorageObjectPath } from './storagePath';

describe('getPublicStoragePath', () => {
  it('extrai e decodifica o caminho de uma URL pública do bucket', () => {
    expect(getPublicStoragePath(
      'https://project.supabase.co/storage/v1/object/public/gallery/cortes/foto%201.webp',
      'gallery',
    )).toBe('cortes/foto 1.webp');
  });

  it('rejeita outro bucket e tentativa de travessia', () => {
    expect(() => getPublicStoragePath(
      'https://project.supabase.co/storage/v1/object/public/avatars/foto.webp',
      'gallery',
    )).toThrow(/não pertence/);
    expect(() => getPublicStoragePath(
      'https://project.supabase.co/storage/v1/object/public/gallery/%2E%2E/segredo',
      'gallery',
    )).toThrow();
  });
});

describe('validateStorageObjectPath', () => {
  it('accepts the canonical professional namespace', () => {
    expect(validateStorageObjectPath('professionals/id-123/avatar.webp')).toBe('professionals/id-123/avatar.webp');
  });

  it.each(['/absolute.webp', '../secret.webp', 'professionals//avatar.webp', 'professionals\\avatar.webp', 'professionals/./avatar.webp'])(
    'rejects an unsafe object path: %s',
    path => expect(() => validateStorageObjectPath(path)).toThrow('inválido'),
  );
});
