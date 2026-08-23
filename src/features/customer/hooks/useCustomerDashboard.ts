import { useRef, useState } from 'react';
import { useApp } from '../../../store/useApp';
import { Booking } from '../../../types';
import { getErrorMessage } from '../../../utils/errors';
import { getServiceName as getSharedServiceName, getProfessionalName as getSharedProfessionalName } from '../../../utils/lookups';
import { formatBRL } from '../../../utils/validation';

export const useCustomerDashboard = () => {
  const {
    bookings,
    services,
    professionals,
    currentUser,
    updateBookingStatus,
    confirmBookingAttendance,
    rescheduleBooking,
    getAvailableSlots,
    config,
  } = useApp();

  const [reschedulingBookingId, setReschedulingBookingId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const slotRequestId = useRef(0);

  const clientBookings = currentUser ? bookings.filter(b => b.customerId === currentUser.id) : [];

  const upcomingBookings = clientBookings.filter(
    b => b.status !== 'Concluído' && b.status !== 'Cancelado' && b.status !== 'Não compareceu'
  ).sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.time.localeCompare(b.time);
  });

  const pastBookings = clientBookings.filter(
    b => b.status === 'Concluído' || b.status === 'Cancelado' || b.status === 'Não compareceu'
  ).sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.time.localeCompare(a.time);
  });

  const getProfessionalName = (id: string) => getSharedProfessionalName(professionals, id);

  const getServiceName = (id: string) => getSharedServiceName(services, id);

  const getServiceDuration = (id: string) => {
    if (!id) return 30;
    return id.split(',').reduce((sum, subId) => sum + (services.find(s => s.id === subId.trim())?.duration || 0), 0);
  };

  const handleConfirmAttendance = async (id: string) => {
    if (!window.confirm("Deseja confirmar sua presença neste agendamento?")) return;
    try {
      await confirmBookingAttendance(id);
      setSuccessMsg("Presença confirmada!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Não foi possível confirmar a presença. Tente novamente.'));
      setTimeout(() => setErrorMsg(""), 4000);
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja cancelar este agendamento?')) return;
    try {
      await updateBookingStatus(id, 'Cancelado');
      setSuccessMsg('Agendamento cancelado com sucesso.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Não foi possível cancelar o agendamento. Tente novamente.'));
      setTimeout(() => setErrorMsg(""), 4000);
    }
  };

  const loadSlotsForReschedule = async (booking: Booking, date: string) => {
    const requestId = ++slotRequestId.current;
    setLoadingTimes(true);
    setErrorMsg('');
    try {
      // Exclui o próprio agendamento do motor de disponibilidade. Apenas
      // recolocar o horário atual não liberava outros horários que se
      // sobrepunham a ele e divergia da validação transacional do backend.
      const slots = await getAvailableSlots(booking.professionalId, booking.serviceId, date, booking.id);
      if (requestId !== slotRequestId.current) return;
      setAvailableTimes(slots);
    } catch (err) {
      if (requestId !== slotRequestId.current) return;
      setAvailableTimes([]);
      setErrorMsg(getErrorMessage(err, 'Não foi possível carregar os horários disponíveis. Tente novamente.'));
    } finally {
      if (requestId === slotRequestId.current) setLoadingTimes(false);
    }
  };

  const handleOpenReschedule = (booking: Booking) => {
    setReschedulingBookingId(booking.id);
    setNewDate(booking.date);
    setNewTime(booking.time);
    setErrorMsg('');
    void loadSlotsForReschedule(booking, booking.date);
  };

  const handleDateChange = (date: string, booking: Booking) => {
    setNewDate(date);
    setNewTime('');
    void loadSlotsForReschedule(booking, date);
  };

  const handleConfirmReschedule = async (id: string) => {
    if (!newDate || !newTime) {
      setErrorMsg('Por favor, selecione data e horário válidos.');
      return;
    }
    try {
      await rescheduleBooking(id, newDate, newTime);
      setSuccessMsg('Agendamento reagendado com sucesso.');
      setReschedulingBookingId(null);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Não foi possível reagendar. O horário pode ter sido reservado por outra pessoa.'));
    }
  };

  return {
    currentUser,
    config,
    upcomingBookings,
    pastBookings,
    reschedulingBookingId,
    setReschedulingBookingId,
    newDate,
    newTime,
    setNewTime,
    availableTimes,
    loadingTimes,
    successMsg,
    errorMsg,
    handleCancel,
    handleConfirmAttendance,
    handleOpenReschedule,
    handleDateChange,
    handleConfirmReschedule,
    getProfessionalName,
    getServiceName,
    getServiceDuration,
    formatBRL
  };
};
