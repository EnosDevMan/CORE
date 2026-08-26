import { validateLogoFile } from './logoCrop';

const COVER_MAX_DIMENSION = 1600;
const COVER_WEBP_QUALITY = 0.86;

/**
 * Converts owner-provided hero media to a bounded WEBP file before upload.
 * The original aspect ratio is preserved; the public hero is responsible for
 * responsive object-fit cropping. This keeps the LCP asset reasonably small
 * without forcing the owner to understand image optimization.
 */
export async function prepareCoverImage(file: File): Promise<File> {
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

    const scale = Math.min(
      1,
      COVER_MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('O navegador não conseguiu preparar a imagem de destaque.');

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        result => result ? resolve(result) : reject(new Error('Não foi possível otimizar a imagem de destaque.')),
        'image/webp',
        COVER_WEBP_QUALITY,
      );
    });

    if (blob.type !== 'image/webp') {
      throw new Error('Este navegador não oferece suporte à otimização WEBP necessária para a imagem de destaque.');
    }

    return new File([blob], `cover-${Date.now()}.webp`, { type: 'image/webp' });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
