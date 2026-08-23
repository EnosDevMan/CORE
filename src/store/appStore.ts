import { useCallback } from 'react';
import { useAuth } from '../auth/hooks/useAuth';
import { useConfigStore } from './configStore';
import { useDataStore } from './dataStore';
import { DEFAULT_BUSINESS_TIMEZONE, getBusinessNow } from '../utils/validation';
import { getAvailability } from '../utils/scheduling';
import { useOptionalBusiness } from '../core/business/hooks';
import { dataService } from '../services/dataService';

export const useAppStore = () => {
  const authState = useAuth();
  const configState = useConfigStore();
  const dataState = useDataStore();
  const business = useOptionalBusiness();
  const timeZone = business?.profile.timezone ?? DEFAULT_BUSINESS_TIMEZONE;

  /**
   * Verifica conflitos de horário usando os agendamentos já carregados
   * localmente, mais uma lista opcional de intervalos ocupados extra.
   *
   * IMPORTANTE: esta função é usada apenas para a experiência do usuário
   * (mostrar quais horários parecem livres). A garantia real contra
   * conflitos de agendamento (condição de corrida) deve acontecer no
   * backend quando ele existir.
   */
  const isSlotAvailable = useCallback((
    professionalId: string,
    date: string,
    time: string,
    duration: number,
    extraBookedIntervals: { time: string; duration: number }[] = [],
    excludeBookingId?: string
  ): boolean => {
    const professional = dataState.professionals.find(item => item.id === professionalId);
    const slots = getAvailability({ professionalId, date, duration, intervalMinutes: configState.config.intervalMinutes, shopHours: configState.config.workingHours, professional, bookings: dataState.bookings, blocks: dataState.scheduleBlocks, services: dataState.services, excludeBookingId, additionalOccupiedIntervals: extraBookedIntervals });
    return slots.some(slot => slot.time === time && slot.status === 'available');
  }, [dataState.professionals, dataState.bookings, dataState.scheduleBlocks, dataState.services, configState.config]);

  const getAvailabilitySlots = useCallback((professionalId: string, serviceId: string, date: string, includeElapsed = false, excludeBookingId?: string, occupiedIntervals: { time: string; duration: number }[] = []) => {
    const duration = serviceId.split(',').reduce((sum, id) => sum + (dataState.services.find(service => service.id === id.trim())?.duration ?? 0), 0);
    const now = getBusinessNow(timeZone);
    const minimumNoticeMinutes = configState.config.minimumNoticeMinutes ?? 30;
    const unavailableBeforeMinutes = !includeElapsed && date === now.dateStr ? now.hours * 60 + now.minutes + minimumNoticeMinutes : undefined;
    return getAvailability({ professionalId, date, duration, intervalMinutes: configState.config.intervalMinutes, shopHours: configState.config.workingHours, professional: dataState.professionals.find(item => item.id === professionalId), bookings: dataState.bookings, blocks: dataState.scheduleBlocks, services: dataState.services, unavailableBeforeMinutes, excludeBookingId, additionalOccupiedIntervals: occupiedIntervals });
  }, [dataState.services, dataState.professionals, dataState.bookings, dataState.scheduleBlocks, configState.config, timeZone]);

  /**
   * Calcula os horários disponíveis para um profissional, serviço e data.
   */
  const getAvailableSlots = useCallback(async (professionalId: string, serviceId: string, date: string, excludeBookingId?: string): Promise<string[]> => {
    if (!serviceId || !professionalId || !date) return [];

    const occupiedIntervals = await dataService.getOccupiedIntervals(professionalId, date, excludeBookingId);
    const slots = getAvailabilitySlots(professionalId, serviceId, date, false, excludeBookingId, occupiedIntervals);
    return slots.filter(slot => slot.status === 'available').map(slot => slot.time);
  }, [getAvailabilitySlots]);

  const { loading: authLoading, error: authError, ...restAuthState } = authState;

  return {
    ...restAuthState,
    authLoading,
    authError,
    ...configState,
    ...dataState,
    isSlotAvailable,
    getAvailableSlots,
    getAvailabilitySlots,
  };
};
