import { describe, expect, it } from 'vitest';
import { generateSlotStartMinutes, getAvailability, resolveDailyHours } from './scheduling';

describe('resolveDailyHours', () => {
  it('mantém daysOpen como fallback para agendas semanais antigas', () => {
    const hours = {
      open: '09:00', close: '18:00', daysOpen: [2],
      weeklySchedule: { 1: { open: '10:00', close: '16:00' } },
    };

    expect(resolveDailyHours(hours, 1).closed).toBe(true);
  });

  it('herda o intervalo geral quando o dia não o repete', () => {
    const hours = {
      open: '09:00', close: '18:00', daysOpen: [1], breakStart: '12:00', breakEnd: '13:00',
      weeklySchedule: { 1: { open: '10:00', close: '16:00', closed: false } },
    };

    expect(resolveDailyHours(hours, 1)).toMatchObject({ breakStart: '12:00', breakEnd: '13:00' });
  });
});

describe('generateSlotStartMinutes', () => {
  it.each([
    { interval: 5, expected: [540, 545, 550, 555, 560, 565, 570, 575, 580, 585, 590, 595, 600, 605, 610, 615, 620, 625, 630] },
    { interval: 10, expected: [540, 550, 560, 570, 580, 590, 600, 610, 620, 630] },
    { interval: 15, expected: [540, 555, 570, 585, 600, 615, 630] },
    { interval: 20, expected: [540, 560, 580, 600, 620] },
    { interval: 30, expected: [540, 570, 600, 630] },
  ])('avança somente o intervalo de $interval minutos definido no admin', ({ interval, expected }) => {
    expect(generateSlotStartMinutes(540, 660, 30, interval)).toEqual(expected);
  });

  it('não oferece um horário cujo serviço ultrapasse o fechamento', () => {
    expect(generateSlotStartMinutes(540, 639, 30, 10)).toEqual([540, 550, 560, 570, 580, 590, 600]);
  });

  it('mantém a mesma grade para serviços de durações diferentes', () => {
    expect(generateSlotStartMinutes(540, 660, 20, 15)).toEqual([540, 555, 570, 585, 600, 615, 630]);
    expect(generateSlotStartMinutes(540, 660, 45, 15)).toEqual([540, 555, 570, 585, 600, 615]);
  });

  it('rejeita configurações que não podem produzir horários válidos', () => {
    expect(generateSlotStartMinutes(540, 660, 0, 10)).toEqual([]);
    expect(generateSlotStartMinutes(540, 660, 30, 0)).toEqual([]);
    expect(generateSlotStartMinutes(540, 660, 30, -1)).toEqual([]);
    expect(generateSlotStartMinutes(660, 540, 30, 10)).toEqual([]);
  });
});

describe('getAvailability', () => {
  const input = {
    professionalId: 'barber-1',
    date: '2026-08-10',
    duration: 30,
    intervalMinutes: 30,
    shopHours: { open: '09:00', close: '11:00', daysOpen: [1] },
    bookings: [{
      id: 'booking-1', customerId: 'customer-1', customerName: 'Cliente',
      customerPhone: '85999999999', professionalId: 'barber-1', serviceId: 'service-1',
      date: '2026-08-10', time: '09:00', status: 'Confirmado' as const,
      feePaid: true, value: 30, createdAt: '2026-08-01T00:00:00Z',
    }],
    blocks: [],
    services: [{ id: 'service-1', name: 'Corte', duration: 30, price: 30, description: '', category: 'Corte' }],
  };

  it('mantém o horário ocupado nos fluxos de criação', () => {
    expect(getAvailability(input).find(slot => slot.time === '09:00')?.status).toBe('occupied');
  });

  it('libera 09:30 após um serviço de 30 min iniciado às 09:00', () => {
    expect(getAvailability(input).find(slot => slot.time === '09:30')?.status).toBe('available');
  });

  it('preserva a duração histórica mesmo quando o serviço atual muda', () => {
    const slots = getAvailability({
      ...input,
      bookings: [{ ...input.bookings[0], durationMinutes: 60 }],
      services: [{ ...input.services[0], duration: 15 }],
    });

    expect(slots.find(slot => slot.time === '09:30')?.status).toBe('occupied');
    expect(slots.find(slot => slot.time === '10:00')?.status).toBe('available');
  });

  it('ignora somente o próprio agendamento durante o reagendamento', () => {
    expect(getAvailability({ ...input, excludeBookingId: 'booking-1' }).find(slot => slot.time === '09:00')?.status).toBe('available');
  });

  it('respeita a duração real de intervalos ocupados ainda não persistidos', () => {
    const slots = getAvailability({
      ...input,
      bookings: [],
      additionalOccupiedIntervals: [{ time: '09:00', duration: 60 }],
    });

    expect(slots.find(slot => slot.time === '09:30')?.status).toBe('occupied');
  });

  it('oferece candidatos na grade do admin, não na duração do serviço', () => {
    const slots = getAvailability({
      ...input,
      bookings: [],
      duration: 45,
      intervalMinutes: 30,
    });

    expect(slots.map(slot => slot.time)).toEqual(['09:00', '09:30', '10:00']);
  });

  it('limita o horário especial do profissional ao funcionamento do negócio', () => {
    const slots = getAvailability({
      ...input,
      date: '2026-08-09',
      shopHours: { open: '09:00', close: '18:00', daysOpen: [0], weeklySchedule: { 0: { open: '09:00', close: '13:00', closed: false } } },
      bookings: [],
      blocks: [
        { id: 'barber', professionalId: 'barber-1', type: 'special', date: '2026-08-09', specialHours: { open: '08:00', close: '17:00' } },
      ],
    });

    expect(slots.map(slot => slot.time)).toEqual(['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30']);
  });

  it('não deixa um horário individual abrir um dia em que o salão está fechado', () => {
    expect(getAvailability({
      ...input,
      date: '2026-08-09',
      bookings: [],
      blocks: [{ id: 'barber', professionalId: 'barber-1', type: 'special', date: '2026-08-09', specialHours: { open: '09:00', close: '17:00' } }],
    })).toEqual([]);
  });
});
