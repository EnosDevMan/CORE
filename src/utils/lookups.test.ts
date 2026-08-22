import { describe, it, expect } from 'vitest';
import { getServiceName, getBarberName } from './lookups';
import { Service, Barber } from '../types';

const services: Service[] = [
  { id: 's1', name: 'Corte', price: 40, duration: 30 } as Service,
  { id: 's2', name: 'Barba', price: 30, duration: 20 } as Service,
];

const barbers: Barber[] = [
  { id: 'b1', name: 'João' } as Barber,
];

describe('getServiceName', () => {
  it('resolves a single service id', () => {
    expect(getServiceName(services, 's1')).toBe('Corte');
  });

  it('joins multiple comma-separated service ids with " + "', () => {
    expect(getServiceName(services, 's1,s2')).toBe('Corte + Barba');
  });

  it('tolerates whitespace around ids in the csv', () => {
    expect(getServiceName(services, 's1, s2')).toBe('Corte + Barba');
  });

  it('falls back to "Desconhecido" for empty or unmatched ids (regression: previously returned "" for unmatched ids in some call sites)', () => {
    expect(getServiceName(services, '')).toBe('Desconhecido');
    expect(getServiceName(services, 'nao-existe')).toBe('Desconhecido');
  });
});

describe('getBarberName', () => {
  it('resolves a known barber', () => {
    expect(getBarberName(barbers, 'b1')).toBe('João');
  });

  it('falls back to "Desconhecido" for an unknown id', () => {
    expect(getBarberName(barbers, 'nao-existe')).toBe('Desconhecido');
  });
});
