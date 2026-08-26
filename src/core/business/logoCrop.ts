export const LOGO_OUTPUT_SIZE = 512;
export const MAX_LOGO_FILE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_LOGO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export interface LogoCropOptions {
  zoom: number;
  positionX: number;
  positionY: number;
}

export interface SquareCrop {
  sourceX: number;
  sourceY: number;
  sourceSize: number;
}

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

export function validateLogoFile(file: Pick<File, 'size' | 'type'>): void {
  if (!ALLOWED_LOGO_TYPES.includes(file.type as (typeof ALLOWED_LOGO_TYPES)[number])) {
    throw new Error('Formato não suportado. Envie uma imagem JPG, PNG ou WEBP.');
  }
  if (file.size > MAX_LOGO_FILE_BYTES) {
    throw new Error('A imagem deve ter no máximo 5 MB.');
  }
  if (file.size === 0) throw new Error('O arquivo selecionado está vazio.');
}

/** Maps the editor controls to the exact square sampled from the source image. */
export function calculateSquareCrop(
  imageWidth: number,
  imageHeight: number,
  options: LogoCropOptions,
): SquareCrop {
  if (imageWidth <= 0 || imageHeight <= 0) throw new Error('A imagem possui dimensões inválidas.');

  const zoom = clamp(options.zoom, 1, 3);
  const positionX = clamp(options.positionX, 0, 100) / 100;
  const positionY = clamp(options.positionY, 0, 100) / 100;
  const sourceSize = Math.min(imageWidth, imageHeight) / zoom;

  return {
    sourceX: (imageWidth - sourceSize) * positionX,
    sourceY: (imageHeight - sourceSize) * positionY,
    sourceSize,
  };
}

export async function renderCroppedLogo(file: File, options: LogoCropOptions): Promise<File> {
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

    const crop = calculateSquareCrop(image.naturalWidth, image.naturalHeight, options);
    const canvas = document.createElement('canvas');
    canvas.width = LOGO_OUTPUT_SIZE;
    canvas.height = LOGO_OUTPUT_SIZE;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('O navegador não conseguiu preparar o editor da logo.');

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.clearRect(0, 0, LOGO_OUTPUT_SIZE, LOGO_OUTPUT_SIZE);
    context.drawImage(
      image,
      crop.sourceX,
      crop.sourceY,
      crop.sourceSize,
      crop.sourceSize,
      0,
      0,
      LOGO_OUTPUT_SIZE,
      LOGO_OUTPUT_SIZE,
    );

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        result => result ? resolve(result) : reject(new Error('Não foi possível finalizar o recorte da logo.')),
        'image/webp',
        0.92,
      );
    });
    if (blob.type !== 'image/webp') {
      throw new Error('Este navegador não oferece suporte à otimização WEBP necessária para a logo.');
    }

    return new File([blob], `logo-${Date.now()}.webp`, { type: 'image/webp' });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
