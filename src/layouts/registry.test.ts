import { describe, expect, it } from 'vitest';
import { NICHE_REGISTRY } from '../niches/registry';
import { PUBLIC_LAYOUT_REGISTRY, getPublicLayoutPreset } from './registry';

describe('public layout registry', () => {
  it('keeps each base layout structurally complete', () => {
    for (const layout of Object.values(PUBLIC_LAYOUT_REGISTRY)) {
      expect(layout.sectionOrder).toHaveLength(4);
      expect(new Set(layout.sectionOrder).size).toBe(4);
      expect(layout.sectionOrder).toEqual(expect.arrayContaining(['features', 'services', 'gallery', 'professionals']));
    }
  });

  it('provides genuinely different base compositions', () => {
    const signatures = Object.values(PUBLIC_LAYOUT_REGISTRY).map(layout => `${layout.heroVariant}:${layout.sectionOrder.join('>')}:${layout.sectionStyle}`);
    expect(new Set(signatures).size).toBe(Object.keys(PUBLIC_LAYOUT_REGISTRY).length);
  });

  it('keeps four recognisable art directions inside every niche', () => {
    for (const niche of Object.values(NICHE_REGISTRY)) {
      const layouts = niche.availableStyleIds.map(styleId => getPublicLayoutPreset(styleId, niche.id));
      expect(layouts).toHaveLength(4);
      expect(new Set(layouts.map(layout => layout.name)).size).toBe(4);
      expect(new Set(layouts.map(layout => layout.heroVariant)).size).toBe(4);
      expect(layouts.every(layout => layout.sectionOrder.length === 4)).toBe(true);
    }
  });
});
