import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDataStore } from './dataStore';
import { dataService } from '../services/dataService';
import type { Booking, Professional, Service, User } from '../types';

vi.mock('../services/dataService', () => ({
  dataService: {
    updateUserRole: vi.fn(),
    deleteUserAccount: vi.fn(),
    saveService: vi.fn(),
  },
}));

const customer: User = {
  id: 'customer-1',
  email: 'customer@example.test',
  name: 'Cliente Teste',
  role: 'customer',
};

const professional: Professional = {
  id: 'agenda-1',
  name: 'Profissional Teste',
  avatar: '',
  specialty: '',
  active: true,
  userId: customer.id,
};

const booking: Booking = {
  id: 'booking-1',
  customerId: customer.id,
  customerName: customer.name,
  customerPhone: '85999999999',
  professionalId: professional.id,
  serviceId: 'service-1',
  date: '2026-08-30',
  time: '10:00',
  status: 'Confirmado',
  feePaid: false,
  value: 50,
  createdAt: '2026-08-24T10:00:00Z',
};

const service = (id: string, name: string): Service => ({
  id, name, duration: 30, price: 50, description: '', category: 'Geral', active: true,
});

const deferred = () => {
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<void>((_resolve, rejectPromise) => { reject = rejectPromise; });
  return { promise, reject };
};

beforeEach(() => {
  vi.clearAllMocks();
  useDataStore.setState({
    users: [customer],
    professionals: [professional],
    bookings: [booking],
  });
});

describe('owner-managed account state', () => {
  it('updates roles only after the protected database operation succeeds', async () => {
    vi.mocked(dataService.updateUserRole).mockResolvedValue(undefined);

    await useDataStore.getState().updateUserRole(customer.id, 'professional');

    expect(dataService.updateUserRole).toHaveBeenCalledWith(customer.id, 'professional');
    expect(useDataStore.getState().users[0]?.role).toBe('professional');
  });

  it('refuses to demote an account still linked to a professional agenda', async () => {
    useDataStore.setState({ users: [{ ...customer, role: 'professional', profileId: professional.id }] });

    await expect(useDataStore.getState().updateUserRole(customer.id, 'customer'))
      .rejects.toThrow('Desvincule a conta');
    expect(dataService.updateUserRole).not.toHaveBeenCalled();
  });

  it('removes login ownership while preserving booking history after deletion', async () => {
    vi.mocked(dataService.deleteUserAccount).mockResolvedValue(undefined);

    await useDataStore.getState().deleteUserAccount(customer.id);

    expect(useDataStore.getState().users).toEqual([]);
    expect(useDataStore.getState().professionals[0]?.userId).toBeUndefined();
    expect(useDataStore.getState().bookings[0]).toMatchObject({
      id: booking.id,
      customerId: 'guest',
      customerName: customer.name,
      value: 50,
    });
  });

  it('does not modify local collections when account removal fails', async () => {
    vi.mocked(dataService.deleteUserAccount).mockRejectedValue(new Error('Sem permissão'));

    await expect(useDataStore.getState().deleteUserAccount(customer.id)).rejects.toThrow('Sem permissão');

    expect(useDataStore.getState().users).toEqual([customer]);
    expect(useDataStore.getState().bookings[0]?.customerId).toBe(customer.id);
  });
});

describe('concurrent optimistic mutations', () => {
  it('does not erase a confirmed edit to another record when an older request fails', async () => {
    const firstFailure = deferred();
    vi.mocked(dataService.saveService)
      .mockReturnValueOnce(firstFailure.promise)
      .mockResolvedValueOnce(undefined);
    useDataStore.setState({ services: [service('one', 'One'), service('two', 'Two')] });

    const failingUpdate = useDataStore.getState().updateService(service('one', 'One changed'));
    await useDataStore.getState().updateService(service('two', 'Two changed'));
    firstFailure.reject(new Error('network failed'));

    await expect(failingUpdate).rejects.toThrow('network failed');
    expect(useDataStore.getState().services).toEqual([
      service('one', 'One'),
      service('two', 'Two changed'),
    ]);
  });

  it('keeps the newest edit when an older request for the same record fails later', async () => {
    const firstFailure = deferred();
    vi.mocked(dataService.saveService)
      .mockReturnValueOnce(firstFailure.promise)
      .mockResolvedValueOnce(undefined);
    useDataStore.setState({ services: [service('one', 'One')] });

    const olderUpdate = useDataStore.getState().updateService(service('one', 'Older'));
    await useDataStore.getState().updateService(service('one', 'Newest'));
    firstFailure.reject(new Error('late failure'));

    await expect(olderUpdate).rejects.toThrow('late failure');
    expect(useDataStore.getState().services).toEqual([service('one', 'Newest')]);
  });
});
