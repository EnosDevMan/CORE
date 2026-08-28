import { useEffect, useState } from 'react';
import { getBusinessTodayStr } from '../utils/validation';

const CLOCK_REFRESH_MS = 30_000;

/** Keeps date-dependent screens correct across midnight in the business timezone. */
export const useBusinessToday = (timeZone: string): string => {
  const [today, setToday] = useState(() => getBusinessTodayStr(timeZone));

  useEffect(() => {
    const refresh = () => setToday(current => {
      const next = getBusinessTodayStr(timeZone);
      return current === next ? current : next;
    });
    refresh();
    const interval = window.setInterval(refresh, CLOCK_REFRESH_MS);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [timeZone]);

  return today;
};
