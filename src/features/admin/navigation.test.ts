import { describe, expect, it } from 'vitest';
import { NICHE_REGISTRY } from '../../niches/registry';
import { getAdminNavigation } from './navigation';

describe('admin capability navigation', () => {
  it('does not expose disabled modules', () => {
    const enabled = new Set(['online_booking', 'customers', 'professionals', 'services']);
    const items = getAdminNavigation(
      NICHE_REGISTRY.beauty_salon,
      capability => enabled.has(capability),
    );
    const ids = items.map(item => item.id);

    expect(ids).toContain('agenda');
    expect(ids).not.toContain('reports');
    expect(ids).not.toContain('pets');
    expect(ids).toContain('accounts');
  });

  it('uses niche terminology and exposes pets only when enabled', () => {
    const items = getAdminNavigation(NICHE_REGISTRY.pet_shop, capability => capability === 'pets');

    expect(items.find(item => item.id === 'professionals')).toBeUndefined();
    expect(items.find(item => item.id === 'pets')?.label).toBe('Pets');
    expect(items.some(item => item.label === 'Tutores')).toBe(false);
  });
});
