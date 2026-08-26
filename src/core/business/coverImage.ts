import { prepareOptimizedImage } from '../../utils/imageOptimization';

const COVER_MAX_DIMENSION = 1600;
const COVER_WEBP_QUALITY = 0.86;

/**
 * Converts owner-provided hero media to a bounded WEBP file before upload.
 * The original aspect ratio is preserved; the public hero is responsible for
 * responsive object-fit cropping. This keeps the LCP asset reasonably small
 * without forcing the owner to understand image optimization.
 */
export const prepareCoverImage = (file: File): Promise<File> => prepareOptimizedImage(file, {
  maxDimension: COVER_MAX_DIMENSION,
  quality: COVER_WEBP_QUALITY,
  filenamePrefix: 'cover',
});
