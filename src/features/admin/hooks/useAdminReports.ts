import { useEffect, useMemo, useState } from 'react';
import { useProfessionals, useServices } from '../../../store/useApp';
import { useBusinessToday } from '../../../hooks/useBusinessToday';
import { useBusiness } from '../../../core/business/hooks';
import { getProfessionalName as getSharedProfessionalName } from '../../../utils/lookups';
import { buildServiceRevenueBreakdown } from '../serviceRevenue';
import { adminHistoryService } from '../../../services/adminHistoryService';
import type { Booking } from '../../../types';

export type ReportPeriod = 'day' | 'week' | 'month' | 'year' | 'custom';

export interface ReportChartBucket {
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

const startOfWeek = (date: Date): Date => {
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  return addDays(date, diffToMonday);
};

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

const buildRange = (period: ReportPeriod, offset: number, today: Date, customStart?: string, customEnd?: string) => {
  if (period === 'custom') {
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
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const professionals = useProfessionals();
  const services = useServices();
  const { profile } = useBusiness();
  const [period, setPeriodState] = useState<ReportPeriod>('week');
  const [offset, setOffset] = useState(0);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const todayStr = useBusinessToday(profile.timezone);

  const setPeriod = (next: ReportPeriod) => {
    setPeriodState(next);
    setOffset(0);
    if (next === 'custom' && !customStartDate && !customEndDate) {
      const today = new Date(todayStr + 'T00:00:00');
      setCustomStartDate(toYMD(addDays(today, -29)));
      setCustomEndDate(todayStr);
    }
  };

  const goToPreviousPeriod = () => setOffset(current => current + 1);
  const goToNextPeriod = () => setOffset(current => Math.max(0, current - 1));

  const { rangeStart, rangeEnd, rangeLabel, buckets } = useMemo(() => {
    const today = new Date(todayStr + 'T00:00:00');
    return buildRange(period, offset, today, customStartDate, customEndDate);
  }, [period, offset, todayStr, customStartDate, customEndDate]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');
    void adminHistoryService.loadReportBookings(rangeStart, rangeEnd)
      .then(rows => { if (active) setBookings(rows); })
      .catch(error => {
        if (active) {
          setBookings([]);
          setLoadError(error instanceof Error ? error.message : 'Não foi possível carregar o relatório.');
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [rangeEnd, rangeStart]);

  const bookingsInRange = useMemo(
    () => bookings.filter(booking => booking.date >= rangeStart && booking.date <= rangeEnd),
    [bookings, rangeStart, rangeEnd],
  );

  const completedInRange = useMemo(
    () => bookingsInRange.filter(booking => booking.status === 'Concluído'),
    [bookingsInRange],
  );

  const revenueInRange = useMemo(
    () => completedInRange.reduce((sum, booking) => sum + booking.value, 0),
    [completedInRange],
  );

  const cancelledCount = useMemo(
    () => bookingsInRange.filter(booking => booking.status === 'Cancelado').length,
    [bookingsInRange],
  );

  const noShowCount = useMemo(
    () => bookingsInRange.filter(booking => booking.status === 'Não compareceu').length,
    [bookingsInRange],
  );

  const pendingCount = bookingsInRange.length - completedInRange.length - cancelledCount - noShowCount;

  const chartData: ReportChartBucket[] = useMemo(() => {
    return buckets.map(bucket => {
      const value = completedInRange
        .filter(booking => booking.date >= bucket.start && booking.date <= bucket.end)
        .reduce((sum, booking) => sum + booking.value, 0);
      return { start: bucket.start, label: bucket.label, value };
    });
  }, [buckets, completedInRange]);

  const maxChartValue = Math.max(1, ...chartData.map(data => data.value));

  const professionalBreakdown: ReportBreakdownItem[] = useMemo(() => {
    const map: Record<string, ReportBreakdownItem> = {};
    completedInRange.forEach(booking => {
      if (!map[booking.professionalId]) {
        map[booking.professionalId] = {
          id: booking.professionalId,
          name: getSharedProfessionalName(professionals, booking.professionalId),
          count: 0,
          total: 0,
        };
      }
      map[booking.professionalId].count += 1;
      map[booking.professionalId].total += booking.value;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [completedInRange, professionals]);

  const serviceBreakdown: ReportBreakdownItem[] = useMemo(
    () => buildServiceRevenueBreakdown(completedInRange, services),
    [completedInRange, services],
  );

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
    loading,
    loadError,
  };
};
