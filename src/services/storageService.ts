import { supabase } from '../lib/supabaseClient';
import { prepareOptimizedImage } from '../utils/imageOptimization';
export { getPublicStoragePath } from './storagePath';
import { getPublicStoragePath } from './storagePath';

const MAX_FILE_SIZE_MB = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const asWebpPath = (path: string): string => {
  const lastSlash = path.lastIndexOf('/');
  const lastDot = path.lastIndexOf('.');
  if (lastDot > lastSlash) return `${path.slice(0, lastDot)}.webp`;
  return `${path}.webp`;
};

/**
 * Envia uma imagem para um bucket público do Supabase Storage e retorna a
 * URL pública definitiva.
 *
 * Fotos de profissionais passam por otimização centralizada aqui. Assim tanto
 * o painel administrativo quanto a autoedição do profissional recebem o mesmo
 * limite sem cada tela precisar lembrar de comprimir a câmera do celular.
 * Capa, galeria e logo já possuem pipelines específicos antes desta função.
 *
 * @param file Arquivo de imagem selecionado pelo usuário
 * @param path Caminho/nome de destino dentro do bucket
 * @param bucket Bucket de destino (padrão: `avatars`)
 */
export async function uploadImage(file: File, path: string, bucket: string = 'avatars'): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Formato de imagem não suportado. Use JPG, PNG ou WEBP.');
  }
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    throw new Error(`Imagem muito grande. O tamanho máximo é ${MAX_FILE_SIZE_MB}MB.`);
  }

  let uploadFile = file;
  let uploadPath = path;
  if (bucket === 'avatars') {
    uploadFile = await prepareOptimizedImage(file, {
      maxDimension: 900,
      quality: 0.82,
      filenamePrefix: 'professional',
    });
    uploadPath = asWebpPath(path);
  }

  const { error } = await supabase.storage.from(bucket).upload(uploadPath, uploadFile, {
    upsert: false,
    cacheControl: '31536000',
    contentType: uploadFile.type,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(bucket).getPublicUrl(uploadPath);
  return data.publicUrl;
}

export async function removePublicImage(publicUrl: string, bucket: string): Promise<void> {
  const path = getPublicStoragePath(publicUrl, bucket);
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw new Error(error.message);
}
