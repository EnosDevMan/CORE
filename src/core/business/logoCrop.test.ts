import { describe, expect, it } from 'vitest';
import { calculateSquareCrop, MAX_LOGO_FILE_BYTES, validateLogoFile } from './logoCrop';

describe('logoCrop', () => {
  it('centers a landscape image and respects zoom', () => {
    expect(calculateSquareCrop(1200, 800, { zoom: 1, positionX: 50, positionY: 50 })).toEqual({
      sourceX: 200,
      sourceY: 0,
      sourceSize: 800,
    });
    expect(calculateSquareCrop(1200, 800, { zoom: 2, positionX: 50, positionY: 50 })).toEqual({
      sourceX: 400,
      sourceY: 200,
      sourceSize: 400,
    });
  });

  it('moves the crop focus and clamps editor values', () => {
    expect(calculateSquareCrop(800, 1200, { zoom: 1, positionX: -20, positionY: 120 })).toEqual({
      sourceX: 0,
      sourceY: 400,
      sourceSize: 800,
    });
  });

  it('rejects unsupported, empty and oversized files', () => {
    expect(() => validateLogoFile({ type: 'image/svg+xml', size: 100 })).toThrow(/formato/i);
    expect(() => validateLogoFile({ type: 'image/png', size: 0 })).toThrow(/vazio/i);
    expect(() => validateLogoFile({ type: 'image/png', size: MAX_LOGO_FILE_BYTES + 1 })).toThrow(/5 MB/i);
    expect(() => validateLogoFile({ type: 'image/webp', size: 100 })).not.toThrow();
  });
});
