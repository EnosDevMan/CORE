import { describe, expect, it } from 'vitest';
import { buildServiceRevenueBreakdown } from './serviceRevenue';
import type { Booking, Service } from '../../types';

const booking = (overrides: Partial<Booking> = {}): Booking => ({
  id: 'booking-1', customerId: 'customer-1', customerName: 'Cliente', customerPhone: '85999999999',
  professionalId: 'professional-1', serviceId: 'cut,beard', date: '2026-08-24', time: '10:00',
  status: 'Concluído', feePaid: false, value: 100, createdAt: '2026-08-24T10:00:00Z',
  ...overrides,
});

const services: Service[] = [
  { id: 'cut', name: 'Corte atual', duration: 30, price: 120, description: '', category: '' },
  { id: 'beard', name: 'Barba atual', duration: 20, price: 60, description: '', category: '' },
];

describe('historical service revenue allocation', () => {
  it('keeps the original names and uneven prices after catalog changes', () => {
    expect(buildServiceRevenueBreakdown([booking({
      serviceItems: [
        { serviceId: 'cut', name: 'Corte antigo', durationMinutes: 30, price: 70 },
        { serviceId: 'beard', name: 'Barba antiga', durationMinutes: 20, price: 30 },
      ],
    })], services)).toEqual([
      { id: 'cut', name: 'Corte antigo', count: 1, total: 70 },
      { id: 'beard', name: 'Barba antiga', count: 1, total: 30 },
    ]);
  });

  it('allocates legacy combos proportionally instead of dividing equally', () => {
    expect(buildServiceRevenueBreakdown([booking({ value: 90 })], services)).toEqual([
      { id: 'cut', name: 'Corte atual', count: 1, total: 60 },
      { id: 'beard', name: 'Barba atual', count: 1, total: 30 },
    ]);
  });

  it('preserves exact cents even when equal shares do not divide evenly', () => {
    const result = buildServiceRevenueBreakdown([
      booking({ value: 1, serviceId: 'first,second,third' }),
    ], []);

    expect(result.reduce((sum, item) => sum + item.total, 0)).toBeCloseTo(1, 2);
    expect(result).toHaveLength(3);
  });
});
