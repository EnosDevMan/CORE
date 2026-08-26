import { validateLogoFile } from '../core/business/logoCrop';

interface OptimizedImageOptions {
  maxDimension: number;
  quality?: number;
  filenamePrefix?: string;
}

/**
 * Reduz imagens públicas no próprio navegador antes do upload.
 *
 * Além de economizar Storage, evita que a home e os painéis precisem baixar
 * fotos de vários megabytes vindas diretamente da câmera do celular. O
 * aspecto original é preservado e o resultado é WEBP, sem serviço externo.
 */
export async function prepareOptimizedImage(
  file: File,
  { maxDimension, quality = 0.84, filenamePrefix = 'image' }: OptimizedImageOptions,
): Promise<File> {
  validateLogoFile(file);
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = new Image();
    image.decoding = 'async';
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Não foi possível ler a imagem selecionada.'));
      image.src = objectUrl;
    });

    if (image.naturalWidth <= 0 || image.naturalHeight <= 0) {
      throw new Error('A imagem possui dimensões inválidas.');
    }

    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('O navegador não conseguiu preparar a imagem.');

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        result => result ? resolve(result) : reject(new Error('Não foi possível otimizar a imagem.')),
        'image/webp',
        quality,
      );
    });

    if (blob.type !== 'image/webp') {
      throw new Error('Este navegador não oferece suporte à otimização WEBP necessária.');
    }

    return new File([blob], `${filenamePrefix}-${Date.now()}.webp`, { type: 'image/webp' });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
