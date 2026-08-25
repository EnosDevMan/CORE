import type { Booking, Service } from '../../types';

export interface ServiceRevenueItem {
  id: string;
  name: string;
  count: number;
  total: number;
}

/** Accurate historical allocation; legacy bookings fall back to price weights. */
export function buildServiceRevenueBreakdown(bookings: Booking[], services: Service[]): ServiceRevenueItem[] {
  const byService = new Map<string, ServiceRevenueItem>();
  const catalog = new Map(services.map(service => [service.id, service]));

  for (const booking of bookings) {
    const snapshots = booking.serviceItems;
    const ids = booking.serviceId.split(',').map(id => id.trim()).filter(Boolean);
    if (!snapshots?.length && ids.length === 0) continue;

    const lines = snapshots?.length
      ? snapshots.map(item => ({ id: item.serviceId, name: item.name, weight: item.price }))
      : ids.map(id => ({ id, name: catalog.get(id)?.name ?? 'Serviço não encontrado', weight: catalog.get(id)?.price ?? 0 }));
    const totalWeight = lines.reduce((sum, line) => sum + line.weight, 0);
    const bookingCents = Math.round(booking.value * 100);
    let allocatedCents = 0;

    lines.forEach((line, index) => {
      const cents = index === lines.length - 1
        ? bookingCents - allocatedCents
        : Math.round(bookingCents * (totalWeight > 0 ? line.weight / totalWeight : 1 / lines.length));
      allocatedCents += cents;

      const item = byService.get(line.id) ?? { id: line.id, name: line.name, count: 0, total: 0 };
      item.count += 1;
      item.total = Math.round((item.total + cents / 100) * 100) / 100;
      byService.set(line.id, item);
    });
  }

  return [...byService.values()].sort((first, second) => second.total - first.total);
}
