import { useMemo, useState } from 'react';
import { useApp } from '../../../store/useApp';
import { getBusinessTodayStr } from '../../../utils/validation';
import { useBusiness } from '../../../core/business/hooks';
import { getProfessionalName as getSharedProfessionalName, getServiceName as getSharedServiceName } from '../../../utils/lookups';

export type ReportPeriod = 'day' | 'week' | 'month' | 'year' | 'custom';

export interface ReportChartBucket {
  /** Data de início do bucket (YYYY-MM-DD) — único dentro de qualquer
   * período exibido, então serve como key estável no gráfico (o `label`
   * sozinho pode se repetir, ex: mesmo dia da semana em semanas diferentes). */
  start: string;
  label: string;
  value: number;
}

export interface ReportBreakdownItem {
  id: string;
  name: string;
  count: number;
  total: number;
}

interface DateBucket {
  start: string;
  end: string;
  label: string;
}

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const toYMD = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const addDays = (date: Date, days: number): Date => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};

// Semana começando na segunda-feira, para bater com o mesmo critério já
// usado no painel do barbeiro (useProfessionalDashboard.isThisWeek).
const startOfWeek = (date: Date): Date => {
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  return addDays(date, diffToMonday);
};

// Divide um intervalo arbitrário (filtro "Período personalizado") em
// buckets para o gráfico, adaptando a granularidade ao tamanho do
// intervalo: dia a dia se for curto, por semana se for médio, por mês se
// for longo — um intervalo de 2 anos dividido dia a dia teria centenas de
// barras minúsculas e ilegíveis no gráfico.
const buildCustomBuckets = (start: Date, end: Date): DateBucket[] => {
  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);

  if (totalDays <= 31) {
    return Array.from({ length: totalDays }, (_, i) => {
      const d = addDays(start, i);
      const ymd = toYMD(d);
      return { start: ymd, end: ymd, label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) };
    });
  }

  if (totalDays <= 180) {
    const buckets: DateBucket[] = [];
    let cursor = new Date(start);
    let weekNum = 1;
    while (cursor <= end) {
      const chunkEnd = new Date(Math.min(addDays(cursor, 6).getTime(), end.getTime()));
      buckets.push({ start: toYMD(cursor), end: toYMD(chunkEnd), label: `Sem ${weekNum}` });
      cursor = addDays(chunkEnd, 1);
      weekNum++;
    }
    return buckets;
  }

  const buckets: DateBucket[] = [];
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor <= end) {
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const chunkEnd = monthEnd < end ? monthEnd : end;
    const chunkStart = cursor < start ? start : cursor;
    buckets.push({
      start: toYMD(chunkStart),
      end: toYMD(chunkEnd),
      label: `${MONTH_LABELS[cursor.getMonth()]}/${String(cursor.getFullYear()).slice(2)}`,
    });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  return buckets;
};

/**
 * Calcula, para um período (dia/semana/mês/ano) e um deslocamento em
 * relação ao período atual (0 = período atual, 1 = anterior, etc.), o
 * intervalo de datas correspondente e os "buckets" usados no gráfico de
 * evolução (ex: 7 dias numa semana, 12 meses num ano).
 */
const buildRange = (period: ReportPeriod, offset: number, today: Date, customStart?: string, customEnd?: string) => {
  if (period === 'custom') {
    // Se o cliente ainda não escolheu nada, ou escolheu fim antes do
    // início, cai num intervalo padrão razoável (últimos 30 dias) em vez
    // de gerar um intervalo inválido/vazio.
    const validStart = customStart && customEnd && customStart <= customEnd ? customStart : toYMD(addDays(today, -29));
    const validEnd = customStart && customEnd && customStart <= customEnd ? customEnd : toYMD(today);
    const startDate = new Date(validStart + 'T00:00:00');
    const endDate = new Date(validEnd + 'T00:00:00');
    return {
      rangeStart: validStart,
      rangeEnd: validEnd,
      rangeLabel: `${startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} – ${endDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`,
      buckets: buildCustomBuckets(startDate, endDate),
    };
  }

  if (period === 'day') {
    const target = addDays(today, -offset);
    const ymd = toYMD(target);
    return {
      rangeStart: ymd,
      rangeEnd: ymd,
      rangeLabel: target.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }),
      buckets: [] as DateBucket[],
    };
  }

  if (period === 'week') {
    const thisMonday = startOfWeek(today);
    const monday = addDays(thisMonday, -offset * 7);
    const sunday = addDays(monday, 6);
    const buckets: DateBucket[] = Array.from({ length: 7 }, (_, i) => {
      const d = addDays(monday, i);
      const ymd = toYMD(d);
      return { start: ymd, end: ymd, label: WEEKDAY_LABELS[i] };
    });
    return {
      rangeStart: toYMD(monday),
      rangeEnd: toYMD(sunday),
      rangeLabel: `${monday.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} – ${sunday.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`,
      buckets,
    };
  }

  if (period === 'month') {
    const targetMonth = new Date(today.getFullYear(), today.getMonth() - offset, 1);
    const firstDay = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
    const lastDay = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);
    const totalDays = lastDay.getDate();
    const buckets: DateBucket[] = [];
    for (let day = 1; day <= totalDays; day += 7) {
      const chunkStart = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), day);
      const chunkEndDay = Math.min(day + 6, totalDays);
      const chunkEnd = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), chunkEndDay);
      buckets.push({
        start: toYMD(chunkStart),
        end: toYMD(chunkEnd),
        label: `Sem ${buckets.length + 1}`,
      });
    }
    const monthLabel = targetMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return {
      rangeStart: toYMD(firstDay),
      rangeEnd: toYMD(lastDay),
      rangeLabel: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
      buckets,
    };
  }

  // year
  const targetYear = today.getFullYear() - offset;
  const buckets: DateBucket[] = MONTH_LABELS.map((label, idx) => {
    const first = new Date(targetYear, idx, 1);
    const last = new Date(targetYear, idx + 1, 0);
    return { start: toYMD(first), end: toYMD(last), label };
  });
  return {
    rangeStart: `${targetYear}-01-01`,
    rangeEnd: `${targetYear}-12-31`,
    rangeLabel: `${targetYear}`,
    buckets,
  };
};

export const useAdminReports = () => {
  const { bookings, professionals, services } = useApp();
  const { profile } = useBusiness();
  const [period, setPeriodState] = useState<ReportPeriod>('week');
  const [offset, setOffset] = useState(0);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const todayStr = useMemo(() => getBusinessTodayStr(profile.timezone), [profile.timezone]);

  const setPeriod = (next: ReportPeriod) => {
    setPeriodState(next);
    setOffset(0);
    if (next === 'custom' && !customStartDate && !customEndDate) {
      // Preenche com os últimos 30 dias como ponto de partida, para não
      // abrir o filtro personalizado com os campos vazios.
      const today = new Date(todayStr + 'T00:00:00');
      setCustomStartDate(toYMD(addDays(today, -29)));
      setCustomEndDate(todayStr);
    }
  };

  const goToPreviousPeriod = () => setOffset(o => o + 1);
  const goToNextPeriod = () => setOffset(o => Math.max(0, o - 1));

  const { rangeStart, rangeEnd, rangeLabel, buckets } = useMemo(() => {
    const today = new Date(todayStr + 'T00:00:00');
    return buildRange(period, offset, today, customStartDate, customEndDate);
  }, [period, offset, todayStr, customStartDate, customEndDate]);

  const bookingsInRange = useMemo(
    () => bookings.filter(b => b.date >= rangeStart && b.date <= rangeEnd),
    [bookings, rangeStart, rangeEnd]
  );

  const completedInRange = useMemo(
    () => bookingsInRange.filter(b => b.status === 'Concluído'),
    [bookingsInRange]
  );

  const revenueInRange = useMemo(
    () => completedInRange.reduce((sum, b) => sum + b.value, 0),
    [completedInRange]
  );

  const cancelledCount = useMemo(
    () => bookingsInRange.filter(b => b.status === 'Cancelado').length,
    [bookingsInRange]
  );

  // Bug corrigido: "não compareceu" antes entrava na conta de "pendente"
  // (calculada por exclusão), o que é enganoso — um no-show é um desfecho
  // já resolvido, não algo aguardando ação.
  const noShowCount = useMemo(
    () => bookingsInRange.filter(b => b.status === 'Não compareceu').length,
    [bookingsInRange]
  );

  const pendingCount = bookingsInRange.length - completedInRange.length - cancelledCount - noShowCount;

  const chartData: ReportChartBucket[] = useMemo(() => {
    return buckets.map(bucket => {
      const value = completedInRange
        .filter(b => b.date >= bucket.start && b.date <= bucket.end)
        .reduce((sum, b) => sum + b.value, 0);
      return { start: bucket.start, label: bucket.label, value };
    });
  }, [buckets, completedInRange]);

  const maxChartValue = Math.max(1, ...chartData.map(d => d.value));

  const professionalBreakdown: ReportBreakdownItem[] = useMemo(() => {
    const map: Record<string, ReportBreakdownItem> = {};
    completedInRange.forEach(b => {
      if (!map[b.professionalId]) {
        map[b.professionalId] = { id: b.professionalId, name: getSharedProfessionalName(professionals, b.professionalId), count: 0, total: 0 };
      }
      map[b.professionalId].count += 1;
      map[b.professionalId].total += b.value;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [completedInRange, professionals]);

  const serviceBreakdown: ReportBreakdownItem[] = useMemo(() => {
    const map: Record<string, ReportBreakdownItem> = {};
    completedInRange.forEach(b => {
      if (!b.serviceId) return;
      const ids = b.serviceId.split(',').map(id => id.trim()).filter(Boolean);
      if (ids.length === 0) return;
      // Quando o agendamento combina mais de um serviço, dividimos o valor
      // igualmente entre eles para que a soma do detalhamento continue
      // batendo com o faturamento total do período.
      const share = b.value / ids.length;
      ids.forEach(id => {
        if (!map[id]) {
          map[id] = { id, name: getSharedServiceName(services, id), count: 0, total: 0 };
        }
        map[id].count += 1;
        map[id].total += share;
      });
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [completedInRange, services]);

  return {
    period,
    setPeriod,
    offset,
    goToPreviousPeriod,
    goToNextPeriod,
    isCurrentPeriod: offset === 0,
    rangeLabel,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    todayStr,
    completedCount: completedInRange.length,
    cancelledCount,
    noShowCount,
    pendingCount,
    revenueInRange,
    chartData,
    maxChartValue,
    professionalBreakdown,
    serviceBreakdown,
  };
};
