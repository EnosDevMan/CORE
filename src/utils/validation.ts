export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

/**
 * Formatação canônica de moeda (BRL). Usa Intl.NumberFormat para separador
 * de milhar correto (ex: "R$ 1.234,50") — a versão anterior
 * (`val.toFixed(2).replace('.', ',')`) não inseria separador de milhar
 * (mostrava "R$ 1234,50"), e havia ainda mais 2 cópias ligeiramente
 * diferentes desta função duplicadas em hooks de features distintas.
 */
export const formatBRL = (val: number): string => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
};

/**
 * Converte um valor digitado em formato brasileiro (vírgula decimal, ex:
 * "45,90" ou "1.234,56") para number.
 *
 * BUG QUE ISTO CORRIGE: campos de preço usavam `<input type="number">`,
 * que só aceita PONTO como separador decimal — o navegador rejeita
 * silenciosamente a vírgula digitada (o caractere nem aparece no campo).
 * Como todo brasileiro digita preço com vírgula, na prática o campo
 * parecia "não deixar mudar o valor". A correção troca esses campos para
 * `type="text" inputMode="decimal"` (ainda abre teclado numérico no
 * celular) e usa esta função para interpretar o que foi digitado.
 */
export const parseBRNumber = (raw: string): number => {
  const cleaned = (raw || '').trim();
  if (cleaned.includes(',')) {
    // Vírgula presente: assume formato BR (vírgula decimal, ponto de
    // milhar opcional) — remove pontos de milhar, troca a vírgula por ponto.
    return Number(cleaned.replace(/\./g, '').replace(',', '.'));
  }
  return Number(cleaned);
};

/**
 * Validação leve de telefone brasileiro (DDD + número, com ou sem DDI 55).
 * Aceita 10 dígitos (fixo) ou 11 dígitos (celular com 9° dígito), com ou
 * sem o prefixo internacional 55. Não impõe máscara de digitação — apenas
 * valida a quantidade de dígitos antes do envio do formulário.
 */
export const validatePhoneBR = (phone: string): boolean => {
  const digits = (phone || '').replace(/\D/g, '');
  const local = digits.startsWith('55') && digits.length > 11 ? digits.slice(2) : digits;
  return local.length === 10 || local.length === 11;
};

export const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
};

export const minutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/** Fallback used only before a new installation completes onboarding. */
export const DEFAULT_BUSINESS_TIMEZONE = 'America/Sao_Paulo';

/**
 * Retorna a data/hora atual "wall-clock" no fuso horário do negócio,
 * independentemente do fuso horário do dispositivo do usuário.
 */
export const getBusinessNow = (
  timeZone: string,
  now = new Date(),
): { dateStr: string; hours: number; minutes: number } => {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(now);
  } catch {
    throw new Error(`Fuso horário inválido: ${timeZone}.`);
  }

  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') map[part.type] = part.value;
  }

  return {
    dateStr: `${map.year}-${map.month}-${map.day}`,
    hours: Number(map.hour) % 24,
    minutes: Number(map.minute),
  };
};

/** Retorna a data de hoje (YYYY-MM-DD) no fuso horário do negócio. */
export const getBusinessTodayStr = (timeZone: string): string => getBusinessNow(timeZone).dateStr;

/** Retorna o dia da semana de uma data ISO sem depender do fuso do navegador. */
export const getWeekdayFromISODate = (date: string): number | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  // Date normaliza datas impossíveis (por exemplo, 2026-02-31); rejeite-as.
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) return null;

  return parsed.getUTCDay();
};

/**
 * Retorna a última data (YYYY-MM-DD) que o cliente pode selecionar no
 * agendamento, respeitando a quantidade configurada pelo administrador.
 */
export const getBusinessMaxBookingDateStr = (bookingWindowDays: number, timeZone: string, now = new Date()): string => {
  const { dateStr } = getBusinessNow(timeZone, now);
  const [y, m, d] = dateStr.split('-').map(Number);
  // Usa Date.UTC para somar dias sem risco de bugs de fuso/horário de verão.
  const max = new Date(Date.UTC(y, m - 1, d));
  const safeWindow = Number.isInteger(bookingWindowDays) && bookingWindowDays > 0 ? bookingWindowDays : 1;
  max.setUTCDate(max.getUTCDate() + (safeWindow - 1));
  const yyyy = max.getUTCFullYear();
  const mm = String(max.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(max.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const WEEKDAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

/**
 * Converte `workingHours.daysOpen` (ex: [2,3,4,5,6]) num resumo legível,
 * agrupando dias consecutivos abertos em uma faixa (ex: "Terça a Sábado")
 * e os dias fechados numa linha separada. Usado no rodapé do site, que
 * antes exibia um texto fixo ("Terça a Sexta" / "Domingo e Segunda:
 * Fechado") que não refletia a configuração real e ficava desatualizado
 * assim que o admin mudava os dias de funcionamento.
 */
export const summarizeWorkingDays = (
  daysOpen: number[],
  open: string,
  close: string
): { label: string; value: string }[] => {
  const openSet = new Set(daysOpen ?? []);
  const result: { label: string; value: string }[] = [];

  if (openSet.size === 7) {
    return [{ label: 'Todos os dias', value: `${open} - ${close}` }];
  }
  if (openSet.size === 0) {
    return [{ label: 'Todos os dias', value: 'Fechado' }];
  }

  // Agrupa sequências de dias abertos consecutivos (0=Dom ... 6=Sáb).
  let i = 0;
  while (i < 7) {
    if (openSet.has(i)) {
      let j = i;
      while (j + 1 < 7 && openSet.has(j + 1)) j++;
      const label = i === j ? WEEKDAY_LABELS[i] : `${WEEKDAY_LABELS[i]} a ${WEEKDAY_LABELS[j]}`;
      result.push({ label, value: `${open} - ${close}` });
      i = j + 1;
    } else {
      i++;
    }
  }

  const closedDays = Array.from({ length: 7 }, (_, d) => d).filter(d => !openSet.has(d));
  if (closedDays.length) {
    result.push({ label: closedDays.map(d => WEEKDAY_LABELS[d]).join(', '), value: 'Fechado' });
  }

  return result;
};

/** Produces the public company schedule, including distinct hours per day. */
export const summarizeWeeklySchedule = (hours: import('../types').WorkingHours): { label: string; value: string }[] => {
  if (!hours.weeklySchedule) return summarizeWorkingDays(hours.daysOpen, hours.open, hours.close);
  // Exibe na ordem habitual brasileira (segunda a domingo) e agrupa dias
  // consecutivos com o mesmo expediente. Além de ficar mais legível na home,
  // isto evita a impressão de que apenas o primeiro dia mostrado está aberto.
  const days = [1, 2, 3, 4, 5, 6, 0].map(day => {
    const current = hours.weeklySchedule?.[day];
    const closed = current?.closed ?? !hours.daysOpen.includes(day);
    return { day, value: closed ? 'Fechado' : `${current?.open ?? hours.open} - ${current?.close ?? hours.close}` };
  });

  const result: { label: string; value: string }[] = [];
  for (let start = 0; start < days.length;) {
    let end = start;
    while (end + 1 < days.length && days[end + 1].value === days[start].value) end++;
    result.push({
      label: start === end
        ? WEEKDAY_LABELS[days[start].day]
        : `${WEEKDAY_LABELS[days[start].day]} a ${WEEKDAY_LABELS[days[end].day]}`,
      value: days[start].value,
    });
    start = end + 1;
  }
  return result;
};
