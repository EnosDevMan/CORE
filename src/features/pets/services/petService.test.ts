import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ from: vi.fn(), range: vi.fn() }));

vi.mock('../../../lib/supabaseClient', () => ({ supabase: { from: mocks.from } }));

import { petService } from './petService';

const row = (index: number) => ({
  id: `pet-${String(index).padStart(4, '0')}`,
  owner_id: 'owner-1',
  name: `Pet ${index}`,
  species: 'dog',
  breed: null,
  size: 'medium',
  birth_date: null,
  sex: null,
  restrictions: null,
  behavior_notes: null,
  active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
});

beforeEach(() => {
  vi.clearAllMocks();
  const query = {
    select: vi.fn(), eq: vi.fn(), order: vi.fn(), range: mocks.range,
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.order.mockReturnValue(query);
  mocks.from.mockReturnValue(query);
});

describe('petService pagination', () => {
  it('loads every page instead of treating the PostgREST cap as the complete list', async () => {
    mocks.range
      .mockResolvedValueOnce({ data: Array.from({ length: 500 }, (_, index) => row(index)), error: null })
      .mockResolvedValueOnce({ data: [row(500)], error: null });

    const pets = await petService.listAll();

    expect(pets).toHaveLength(501);
    expect(mocks.range).toHaveBeenNthCalledWith(1, 0, 499);
    expect(mocks.range).toHaveBeenNthCalledWith(2, 500, 999);
    expect(pets[500]).toMatchObject({ id: 'pet-0500', ownerId: 'owner-1' });
  });
});
