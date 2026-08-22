import { Barber, Booking, ScheduleBlock, Service, WorkingHours } from '../types';
import { minutesToTime, timeToMinutes, getWeekdayFromISODate } from './validation';

export type SlotStatus = 'available' | 'occupied' | 'blocked' | 'break' | 'closed';

export interface AvailabilitySlot {
  time: string;
  status: SlotStatus;
  reason?: string;
}

export interface AvailabilityInput {
  barberId: string;
  date: string;
  duration: number;
  intervalMinutes: number;
  shopHours: WorkingHours;
  barber?: Barber;
  bookings: Booking[];
  blocks: ScheduleBlock[];
  services: Service[];
  excludeBookingId?: string;
  /** Intervals not persisted as bookings yet (for previews and batch creation). */
  additionalOccupiedIntervals?: { time: string; duration: number }[];
  /** Use this only in customer flows; admin schedules should also show elapsed slots. */
  unavailableBeforeMinutes?: number;
}

const overlaps = (aStart: number, aEnd: number, bStart: number, bEnd: number) =>
  aStart < bEnd && aEnd > bStart;

/** Resolves a weekday without discarding the legacy open/close/daysOpen format. */
export function resolveDailyHours(hours: WorkingHours, weekday: number): Required<Pick<import('../types').DailyWorkingHours, 'open' | 'close' | 'closed'>> & import('../types').DailyWorkingHours {
  const configured = hours.weeklySchedule?.[weekday];
  if (configured) {
    return {
      open: configured.open || hours.open,
      close: configured.close || hours.close,
      // Configurações antigas podem ter o objeto diário sem `closed`.
      // Nesse caso, daysOpen continua sendo a fonte de verdade.
      closed: configured.closed ?? !hours.daysOpen.includes(weekday),
      breakStart: configured.breakStart ?? hours.breakStart,
      breakEnd: configured.breakEnd ?? hours.breakEnd,
    };
  }
  return { open: hours.open, close: hours.close, closed: !hours.daysOpen.includes(weekday), breakStart: hours.breakStart, breakEnd: hours.breakEnd };
}

export function generateSlotStartMinutes(open: number, close: number, duration: number, interval: number): number[] {
  if (duration <= 0 || interval <= 0 || close <= open) return [];
  const length = duration;
  const starts: number[] = [];
  // The configured interval defines the appointment grid. Service duration
  // only determines whether each candidate fits and is free; it must not move
  // the following start time, otherwise every service exposes a different
  // list of hours for the same professional and day.
  for (let current = open; current + length <= close; current += interval) starts.push(current);
  return starts;
}

const bookingDuration = (booking: Booking, services: Service[]) =>
  booking.serviceId.split(',').reduce((total, id) => total + (services.find(service => service.id === id.trim())?.duration ?? 30), 0);

/**
 * Single, side-effect-free availability engine used by public, customer and
 * administrative scheduling. It is deliberately independent from React and
 * persistence so the exact same business rules can be tested and reused.
 */
export function getAvailability(input: AvailabilityInput): AvailabilitySlot[] {
  const weekday = getWeekdayFromISODate(input.date);
  if (weekday === null || input.duration <= 0) return [];

  const shopDaily = resolveDailyHours(input.shopHours, weekday);
  const barberDaily = resolveDailyHours(input.barber?.workingHours ?? input.shopHours, weekday);
  const specials = input.blocks
    .filter(block => block.type === 'special' && block.date === input.date && block.specialHours && (block.barberId === 'all' || block.barberId === input.barberId))
  const shopSpecial = specials.find(block => block.barberId === 'all')?.specialHours;
  const barberSpecial = specials.find(block => block.barberId === input.barberId)?.specialHours;
  const shopHours = shopSpecial ?? shopDaily;
  const barberHours = barberSpecial ?? barberDaily;

  // O salão sempre delimita a janela máxima de atendimento. A agenda do
  // profissional (inclusive um horário especial individual) pode restringir
  // essa janela, mas nunca abrir antes ou fechar depois da barbearia.
  if ((!shopSpecial && shopDaily.closed) || (!barberSpecial && barberDaily.closed)) return [];

  const open = Math.max(timeToMinutes(shopHours.open), timeToMinutes(barberHours.open));
  const close = Math.min(timeToMinutes(shopHours.close), timeToMinutes(barberHours.close));

  return generateSlotStartMinutes(open, close, input.duration, input.intervalMinutes).map(start => {
    const time = minutesToTime(start);
    const end = start + input.duration;
    if (input.unavailableBeforeMinutes !== undefined && start <= input.unavailableBeforeMinutes) return { time, status: 'closed', reason: 'Horário encerrado' };
    const duringShopBreak = shopHours.breakStart && shopHours.breakEnd && overlaps(start, end, timeToMinutes(shopHours.breakStart), timeToMinutes(shopHours.breakEnd));
    const duringBarberBreak = barberHours.breakStart && barberHours.breakEnd && overlaps(start, end, timeToMinutes(barberHours.breakStart), timeToMinutes(barberHours.breakEnd));
    if (duringShopBreak || duringBarberBreak) return { time, status: 'break', reason: 'Intervalo' };

    const block = input.blocks.find(item => {
      if (item.barberId !== 'all' && item.barberId !== input.barberId) return false;
      if (item.type === 'special' && item.specialHours) return false;
      const applies = item.date === input.date || (!!item.startDate && !!item.endDate && input.date >= item.startDate && input.date <= item.endDate);
      if (!applies) return false;
      if (item.type !== 'block') return true;
      return overlaps(start, end, timeToMinutes(item.startTime ?? '00:00'), timeToMinutes(item.endTime ?? '23:59'));
    });
    if (block) return { time, status: 'blocked', reason: block.reason || 'Bloqueado' };

    const occupied = input.bookings.some(booking => {
      if (booking.id === input.excludeBookingId || booking.status === 'Cancelado' || booking.barberId !== input.barberId || booking.date !== input.date) return false;
      const bookedStart = timeToMinutes(booking.time);
      return overlaps(start, end, bookedStart, bookedStart + bookingDuration(booking, input.services));
    }) || (input.additionalOccupiedIntervals ?? []).some(interval => {
      const bookedStart = timeToMinutes(interval.time);
      return interval.duration > 0
        && overlaps(start, end, bookedStart, bookedStart + interval.duration);
    });
    return occupied ? { time, status: 'occupied', reason: 'Ocupado' } : { time, status: 'available' };
  });
}

export const getAvailableSlotTimes = (input: AvailabilityInput) =>
  getAvailability(input).filter(slot => slot.status === 'available').map(slot => slot.time);
