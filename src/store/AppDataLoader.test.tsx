import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDataStore } from './dataStore';
import { AppDataLoader } from './AppDataLoader';

const mocks = vi.hoisted(() => ({
  initializeAuth: vi.fn(() => vi.fn()),
  getRuntime: vi.fn(),
  loadAllData: vi.fn(),
}));

vi.mock('../auth/store/useAuthStore', () => ({
  useAuthStore: (selector: (state: {
    initialize: typeof mocks.initializeAuth;
    loading: boolean;
    currentUser: null;
  }) => unknown) => selector({
    initialize: mocks.initializeAuth,
    loading: false,
    currentUser: null,
  }),
}));

vi.mock('../core/business/businessService', () => ({
  businessService: { getRuntime: mocks.getRuntime },
}));

vi.mock('../services/bootstrapDataService', () => ({
  bootstrapDataService: { loadAllData: mocks.loadAllData },
}));

// dataStore owns mutation actions backed by dataService. This test only covers
// bootstrap state, so keep those unrelated mutation dependencies isolated from
// Supabase/environment initialization just as the previous loader test did.
vi.mock('../services/dataService', () => ({
  dataService: {},
}));

describe('AppDataLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useDataStore.setState({
      professionals: [],
      services: [],
      bookings: [],
      users: [],
      scheduleBlocks: [],
      galleryPhotos: [],
      loading: true,
      loadError: null,
    });
  });

  it('does not load public business data before onboarding is published', async () => {
    mocks.getRuntime.mockResolvedValue(null);

    render(
      <AppDataLoader>
        <div>Aplicação</div>
      </AppDataLoader>,
    );

    await waitFor(() => expect(useDataStore.getState().loading).toBe(false));

    expect(mocks.initializeAuth).toHaveBeenCalledTimes(1);
    expect(mocks.getRuntime).toHaveBeenCalledTimes(1);
    expect(mocks.loadAllData).not.toHaveBeenCalled();
    expect(useDataStore.getState()).toMatchObject({
      professionals: [],
      services: [],
      bookings: [],
      users: [],
      scheduleBlocks: [],
      galleryPhotos: [],
      loadError: null,
    });
  });
});
