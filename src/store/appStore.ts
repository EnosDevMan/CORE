import { useCallback } from 'react';
import { useAuth } from '../auth/hooks/useAuth';
import { useConfigStore } from './configStore';
import { useDataStore } from './dataStore';
import { DEFAULT_BUSINESS_TIMEZONE, getBusinessNow } from '../utils/validation';
import { getAvailability, resolveRequestedDuration } from '../utils/scheduling';
import { useOptionalBusiness } from '../core/business/hooks';
import { dataService } from '../services/dataService';

export const useAppStore = () => {
  const authState = useAuth();
  const configState = useConfigStore();
  const dataState = useDataStore();
  const business = useOptionalBusiness();
  const timeZone = business?.profile.timezone ?? DEFAULT_BUSINESS_TIMEZONE;


  const getAvailableSlots = useCallback(async (professionalId: string, serviceId: string, date: string, excludeBookingId?: string, durationSnapshot?: number, includeElapsed = false): Promise<string[]> => {
    if (!serviceId || !professionalId || !date) return [];
    const occupiedIntervals = await dataService.getOccupiedIntervals(professionalId, date, excludeBookingId);
    const duration = resolveRequestedDuration(serviceId, dataState.services, durationSnapshot);
    const now = getBusinessNow(timeZone);
    const unavailableBeforeMinutes = !includeElapsed && date === now.dateStr ? now.hours * 60 + now.minutes + (configState.config.minimumNoticeMinutes ?? 30) : undefined;
    return getAvailability({
      professionalId, date, duration, intervalMinutes: configState.config.intervalMinutes,
      shopHours: configState.config.workingHours,
      professional: dataState.professionals.find(item => item.id === professionalId),
      bookings: dataState.bookings, blocks: dataState.scheduleBlocks, services: dataState.services,
      unavailableBeforeMinutes, excludeBookingId, additionalOccupiedIntervals: occupiedIntervals,
    }).filter(slot => slot.status === 'available').map(slot => slot.time);
  }, [configState.config, dataState.bookings, dataState.professionals, dataState.scheduleBlocks, dataState.services, timeZone]);


  const {
    loading: authLoading,
    error: authError,
    initializationError: authInitializationError,
    ...restAuthState
  } = authState;

  return {
    ...restAuthState,
    authLoading,
    authError,
    authInitializationError,
    ...configState,
    ...dataState,
    getAvailableSlots,
  };
};
