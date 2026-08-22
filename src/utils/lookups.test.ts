import { describe, it, expect } from 'vitest';
import { getServiceName, getProfessionalName } from './lookups';
import { Service, Professional } from '../types';

const services: Service[] = [
  { id: 's1', name: 'Corte', price: 40, duration: 30 } as Service,
  { id: 's2', name: 'Barba', price: 30, duration: 20 } as Service,
];

const professionals: Professional[] = [
  { id: 'b1', name: 'João' } as Professional,
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

describe('getProfessionalName', () => {
  it('resolves a known barber', () => {
    expect(getProfessionalName(professionals, 'b1')).toBe('João');
  });

  it('falls back to "Desconhecido" for an unknown id', () => {
    expect(getProfessionalName(professionals, 'nao-existe')).toBe('Desconhecido');
  });
});
