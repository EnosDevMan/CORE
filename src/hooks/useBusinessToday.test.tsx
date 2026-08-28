import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useBusinessToday } from './useBusinessToday';

afterEach(() => vi.useRealTimers());

describe('useBusinessToday', () => {
  it('updates an open screen after midnight in the business timezone', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-29T02:59:50Z'));
    const { result } = renderHook(() => useBusinessToday('America/Sao_Paulo'));
    expect(result.current).toBe('2026-08-28');

    act(() => {
      vi.setSystemTime(new Date('2026-08-29T03:00:20Z'));
      vi.advanceTimersByTime(30_000);
    });

    expect(result.current).toBe('2026-08-29');
  });
});
