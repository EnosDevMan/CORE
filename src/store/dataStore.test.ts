import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDataStore } from './dataStore';
import { dataService } from '../services/dataService';
import type { Booking, Professional, User } from '../types';

vi.mock('../services/dataService', () => ({
  dataService: {
    updateUserRole: vi.fn(),
    deleteUserAccount: vi.fn(),
    rescheduleBooking: vi.fn(),
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


describe('day-scoped booking mutations', () => {
  it('upserts an on-demand booking after rescheduling when it is absent from the daily store', async () => {
    const onDemand = { ...booking, id: 'booking-future', date: '2026-09-02', time: '14:00' };
    const updated = { ...onDemand, date: '2026-08-30', time: '16:00' };
    useDataStore.setState({ bookings: [] });
    vi.mocked(dataService.rescheduleBooking).mockResolvedValue(updated);

    await useDataStore.getState().rescheduleBooking(onDemand.id, updated.date, updated.time, onDemand);

    expect(dataService.rescheduleBooking).toHaveBeenCalledWith(onDemand.id, updated.date, updated.time);
    expect(useDataStore.getState().bookings).toEqual([updated]);
  });
});
