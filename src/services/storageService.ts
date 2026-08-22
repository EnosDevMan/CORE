import { supabase } from '../lib/supabaseClient';

const MAX_FILE_SIZE_MB = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Envia uma imagem para um bucket público do Supabase Storage e retorna a
 * URL pública definitiva.
 *
 * @param file Arquivo de imagem selecionado pelo usuário
 * @param path Caminho/nome de destino dentro do bucket (ex: `barbers/${id}.jpg`)
 * @param bucket Bucket de destino (padrão: `avatars`, para não quebrar quem
 *   já chamava esta função sem o terceiro argumento)
 */
export async function uploadImage(file: File, path: string, bucket: string = 'avatars'): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Formato de imagem não suportado. Use JPG, PNG ou WEBP.');
  }
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    throw new Error(`Imagem muito grande. O tamanho máximo é ${MAX_FILE_SIZE_MB}MB.`);
  }

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    cacheControl: '3600',
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/** Remove somente objetos pertencentes ao bucket informado neste projeto. */
export function getPublicStoragePath(publicUrl: string, bucket: string): string {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const url = new URL(publicUrl);
  const markerIndex = url.pathname.indexOf(marker);
  if (markerIndex < 0) throw new Error('A foto não pertence ao Storage configurado.');

  const path = decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
  if (!path || path.includes('..')) throw new Error('Caminho de foto inválido.');
  return path;
}

export async function removePublicImage(publicUrl: string, bucket: string): Promise<void> {
  const path = getPublicStoragePath(publicUrl, bucket);
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw new Error(error.message);
}
