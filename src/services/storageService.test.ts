import { describe, expect, it } from 'vitest';
import { getPublicStoragePath } from './storagePath';

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
