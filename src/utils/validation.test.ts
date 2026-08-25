import { describe, it, expect } from 'vitest';
import { timeToMinutes, minutesToTime, formatBRL, validateEmail, validatePhoneBR, validateOptionalHttpUrl, summarizeWorkingDays, summarizeWeeklySchedule, getWeekdayFromISODate, getBusinessNow, getBusinessMaxBookingDateStr } from './validation';

describe('Validation Utils', () => {
  it('should correctly convert time to minutes', () => {
    expect(timeToMinutes('00:00')).toBe(0);
    expect(timeToMinutes('01:30')).toBe(90);
    expect(timeToMinutes('12:00')).toBe(720);
    expect(timeToMinutes('23:59')).toBe(1439);
  });

  it('should correctly convert minutes to time', () => {
    expect(minutesToTime(0)).toBe('00:00');
    expect(minutesToTime(90)).toBe('01:30');
    expect(minutesToTime(720)).toBe('12:00');
    expect(minutesToTime(1439)).toBe('23:59');
  });
});

describe('business timezone', () => {
  const instant = new Date('2026-08-22T01:30:00.000Z');

  it('resolves the business calendar day independently from the device timezone', () => {
    expect(getBusinessNow('America/Sao_Paulo', instant).dateStr).toBe('2026-08-21');
    expect(getBusinessNow('Europe/Lisbon', instant).dateStr).toBe('2026-08-22');
  });

  it('rejects invalid IANA timezone configuration', () => {
    expect(() => getBusinessNow('Invalid/Timezone', instant)).toThrow(/Fuso horário inválido/);
  });

  it('calculates the booking horizon from the business calendar day', () => {
    expect(getBusinessMaxBookingDateStr(3, 'America/Sao_Paulo', instant)).toBe('2026-08-23');
  });
});

describe('formatBRL', () => {
  // Normaliza espaços (Intl.NumberFormat usa NBSP entre "R$" e o valor,
  // que pode variar sutilmente entre versões de ICU/Node) para o teste não
  // depender do caractere exato.
  const norm = (s: string) => s.replace(/\s/g, ' ');

  it('formats small values with comma as decimal separator', () => {
    expect(norm(formatBRL(44.9))).toBe('R$ 44,90');
  });

  it('formats large values with a thousands separator (regression: old version showed "R$ 1234,50")', () => {
    expect(norm(formatBRL(1234.5))).toBe('R$ 1.234,50');
    expect(norm(formatBRL(5000))).toBe('R$ 5.000,00');
  });

  it('treats NaN/undefined-ish input as zero instead of throwing', () => {
    expect(norm(formatBRL(0))).toBe('R$ 0,00');
  });
});

describe('validateEmail', () => {
  it('accepts well-formed emails', () => {
    expect(validateEmail('cliente@exemplo.com')).toBe(true);
    expect(validateEmail('nome.sobrenome@dominio.com.br')).toBe(true);
  });

  it('rejects malformed emails', () => {
    expect(validateEmail('nao-e-email')).toBe(false);
    expect(validateEmail('sem@dominio')).toBe(false);
    expect(validateEmail('')).toBe(false);
  });
});

describe('validatePhoneBR', () => {
  it('accepts 10 and 11 digit Brazilian numbers, with or without formatting', () => {
    expect(validatePhoneBR('11987654321')).toBe(true);
    expect(validatePhoneBR('(11) 98765-4321')).toBe(true);
    expect(validatePhoneBR('1132654321')).toBe(true); // fixo, 10 dígitos
  });

  it('accepts numbers with the 55 country code prefix', () => {
    expect(validatePhoneBR('5511987654321')).toBe(true);
  });

  it('rejects too short, too long, empty or alphabetic input', () => {
    expect(validatePhoneBR('123')).toBe(false);
    expect(validatePhoneBR('')).toBe(false);
    expect(validatePhoneBR('119876543210000')).toBe(false);
    expect(validatePhoneBR('telefone 11987654321')).toBe(false);
    expect(validatePhoneBR('11+987654321')).toBe(false);
  });
});

describe('validateOptionalHttpUrl', () => {
  it('accepts empty values and absolute HTTP(S) links', () => {
    expect(validateOptionalHttpUrl('')).toBe(true);
    expect(validateOptionalHttpUrl(' https://instagram.com/core ')).toBe(true);
    expect(validateOptionalHttpUrl('http://localhost:4173/perfil')).toBe(true);
  });

  it('rejects unsafe, relative, credentialed and malformed links', () => {
    expect(validateOptionalHttpUrl('javascript:alert(1)')).toBe(false);
    expect(validateOptionalHttpUrl('/perfil')).toBe(false);
    expect(validateOptionalHttpUrl('https://usuario:senha@example.com')).toBe(false);
    expect(validateOptionalHttpUrl('instagram.com/core')).toBe(false);
  });
});

describe('summarizeWorkingDays', () => {
  it('groups a contiguous range of open days (regression: footer used to hardcode this text)', () => {
    // Terça(2) a Sábado(6) aberto, Domingo(0)/Segunda(1) fechado.
    const result = summarizeWorkingDays([2, 3, 4, 5, 6], '08:00', '19:00');
    expect(result).toEqual([
      { label: 'Terça a Sábado', value: '08:00 - 19:00' },
      { label: 'Domingo, Segunda', value: 'Fechado' },
    ]);
  });

  it('handles every day open', () => {
    expect(summarizeWorkingDays([0, 1, 2, 3, 4, 5, 6], '08:00', '18:00')).toEqual([
      { label: 'Todos os dias', value: '08:00 - 18:00' },
    ]);
  });

  it('handles every day closed', () => {
    expect(summarizeWorkingDays([], '08:00', '18:00')).toEqual([
      { label: 'Todos os dias', value: 'Fechado' },
    ]);
  });

  it('handles non-contiguous open days as separate ranges', () => {
    // Aberto só Segunda(1) e Quinta(4)/Sexta(5).
    const result = summarizeWorkingDays([1, 4, 5], '09:00', '17:00');
    expect(result).toEqual([
      { label: 'Segunda', value: '09:00 - 17:00' },
      { label: 'Quinta a Sexta', value: '09:00 - 17:00' },
      { label: 'Domingo, Terça, Quarta, Sábado', value: 'Fechado' },
    ]);
  });
});

describe('summarizeWeeklySchedule', () => {
  it('agrupa o expediente igual de terça a sábado para exibição na home', () => {
    const weeklySchedule = Object.fromEntries(Array.from({ length: 7 }, (_, day) => [day, {
      open: '08:00', close: '18:00', closed: day === 0 || day === 1,
    }]));

    expect(summarizeWeeklySchedule({ open: '08:00', close: '18:00', daysOpen: [2, 3, 4, 5, 6], weeklySchedule })).toEqual([
      { label: 'Segunda', value: 'Fechado' },
      { label: 'Terça a Sábado', value: '08:00 - 18:00' },
      { label: 'Domingo', value: 'Fechado' },
    ]);
  });
});

describe('getWeekdayFromISODate', () => {
  it('calculates weekdays independently from the machine timezone', () => {
    expect(getWeekdayFromISODate('2026-08-01')).toBe(6);
    expect(getWeekdayFromISODate('2026-08-02')).toBe(0);
  });

  it('rejects malformed and impossible dates', () => {
    expect(getWeekdayFromISODate('2026-02-31')).toBeNull();
    expect(getWeekdayFromISODate('01/08/2026')).toBeNull();
  });
});
