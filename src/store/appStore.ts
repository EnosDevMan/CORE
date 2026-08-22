import { useCallback } from 'react';
import { useAuth } from '../auth/hooks/useAuth';
import { useConfigStore } from './configStore';
import { useDataStore } from './dataStore';
import { getBarbershopNow } from '../utils/validation';
import { getAvailability } from '../utils/scheduling';

export const useAppStore = () => {
  const authState = useAuth();
  const configState = useConfigStore();
  const dataState = useDataStore();

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
    barberId: string,
    date: string,
    time: string,
    duration: number,
    extraBookedIntervals: { time: string; duration: number }[] = [],
    excludeBookingId?: string
  ): boolean => {
    const barber = dataState.barbers.find(item => item.id === barberId);
    const slots = getAvailability({ barberId, date, duration, intervalMinutes: configState.config.intervalMinutes, shopHours: configState.config.workingHours, barber, bookings: dataState.bookings, blocks: dataState.scheduleBlocks, services: dataState.services, excludeBookingId, additionalOccupiedIntervals: extraBookedIntervals });
    return slots.some(slot => slot.time === time && slot.status === 'available');
  }, [dataState.barbers, dataState.bookings, dataState.scheduleBlocks, dataState.services, configState.config]);

  const getAvailabilitySlots = useCallback((barberId: string, serviceId: string, date: string, includeElapsed = false, excludeBookingId?: string) => {
    const duration = serviceId.split(',').reduce((sum, id) => sum + (dataState.services.find(service => service.id === id.trim())?.duration ?? 0), 0);
    const now = getBarbershopNow();
    const unavailableBeforeMinutes = !includeElapsed && date === now.dateStr ? now.hours * 60 + now.minutes + 30 : undefined;
    return getAvailability({ barberId, date, duration, intervalMinutes: configState.config.intervalMinutes, shopHours: configState.config.workingHours, barber: dataState.barbers.find(item => item.id === barberId), bookings: dataState.bookings, blocks: dataState.scheduleBlocks, services: dataState.services, unavailableBeforeMinutes, excludeBookingId });
  }, [dataState.services, dataState.barbers, dataState.bookings, dataState.scheduleBlocks, configState.config]);

  /**
   * Calcula os horários disponíveis para um barbeiro/serviço/data.
   */
  const getAvailableSlots = useCallback(async (barberId: string, serviceId: string, date: string, excludeBookingId?: string): Promise<string[]> => {
    if (!serviceId || !barberId || !date) return [];

    const slots = getAvailabilitySlots(barberId, serviceId, date, false, excludeBookingId);
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
