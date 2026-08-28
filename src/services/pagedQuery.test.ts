import { describe, expect, it, vi } from 'vitest';
import { loadPagedRows } from './pagedQuery';

describe('loadPagedRows', () => {
  it('continua após uma página cheia e retorna todos os registros', async () => {
    const first = Array.from({ length: 1000 }, (_, id) => id);
    const load = vi.fn(async (from: number) => ({ data: from === 0 ? first : [1000], error: null }));
    const rows = await loadPagedRows(load);
    expect(rows).toHaveLength(1001);
    expect(load).toHaveBeenCalledTimes(2);
  });
});
