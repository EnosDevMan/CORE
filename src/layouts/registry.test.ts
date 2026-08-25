import { describe, expect, it } from 'vitest';
import { PUBLIC_LAYOUT_REGISTRY } from './registry';

describe('public layout registry', () => {
  it('keeps each layout structurally complete', () => {
    for (const layout of Object.values(PUBLIC_LAYOUT_REGISTRY)) {
      expect(layout.description.length).toBeGreaterThan(20);
      expect(layout.sectionOrder).toHaveLength(4);
      expect(new Set(layout.sectionOrder).size).toBe(4);
      expect(layout.sectionOrder).toEqual(expect.arrayContaining(['features', 'services', 'gallery', 'professionals']));
    }
  });

  it('provides genuinely different section compositions', () => {
    const signatures = Object.values(PUBLIC_LAYOUT_REGISTRY).map(layout => `${layout.heroVariant}:${layout.sectionOrder.join('>')}:${layout.sectionStyle}`);
    expect(new Set(signatures).size).toBe(Object.keys(PUBLIC_LAYOUT_REGISTRY).length);
  });
});
