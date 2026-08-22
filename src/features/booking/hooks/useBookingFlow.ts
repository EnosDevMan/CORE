import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../../store/useApp';
import { Service, Booking } from '../../../types';
import type { Professional } from '../../professionals/types';
import { getBusinessTodayStr, validatePhoneBR } from '../../../utils/validation';
import { useBusiness } from '../../../core/business/hooks';
import { getErrorMessage } from '../../../utils/errors';
import { notificationService } from '../../../services/notificationService';

export const useBookingFlow = (onSuccess?: (bookingId: string) => void, initialServiceId?: string, initialProfessionalId?: string) => {
  const { services: allServices, professionals: allProfessionals, config, currentUser, getAvailableSlots, addBooking } = useApp();
  const { profile } = useBusiness();
  // Profissionais desativados (active=false) não podem ser selecionados no
  // fluxo público de agendamento — antes, "desativar" um barbeiro não
  // tinha nenhum efeito aqui e ele continuava aparecendo para reserva.
  const services = useMemo(() => allServices.filter(s => s.active !== false), [allServices]);
  const professionals = useMemo(() => allProfessionals.filter(b => b.active !== false), [allProfessionals]);

  const [step, setStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState<Service[]>(() => allServices.filter(s => s.active !== false && s.id === initialServiceId));
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(() => allProfessionals.find(b => b.active !== false && b.id === initialProfessionalId) || null);

  const [selectedDate, setSelectedDate] = useState<string>(() => getBusinessTodayStr(profile.timezone));
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [slotsError, setSlotsError] = useState('');

  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [notes, setNotes] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [completedBooking, setCompletedBooking] = useState<Booking | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('Verificando disponibilidade do horário...');

  const totalDuration = useMemo(() => {
    return selectedServices.reduce((acc, s) => acc + s.duration, 0);
  }, [selectedServices]);

  const totalPrice = useMemo(() => {
    return selectedServices.reduce((acc, s) => acc + s.price, 0);
  }, [selectedServices]);

  const toggleService = (service: Service) => {
    setSelectedServices(prev => {
      const isSelected = prev.some(s => s.id === service.id);
      if (isSelected) return prev.filter(s => s.id !== service.id);
      return [...prev, service];
    });
    setSelectedTime('');
  };

  const selectProfessional = (professional: Professional) => {
    setSelectedProfessional(professional);
    setSelectedTime('');
  };

  useEffect(() => {
    if (currentUser) {
      setCustName(currentUser.name);
      setCustPhone(currentUser.phone || '');
    }
  }, [currentUser]);

  useEffect(() => {
    let cancelled = false;

    if (selectedProfessional && selectedDate && selectedServices.length > 0) {
      const serviceIds = selectedServices.map(s => s.id).join(",");
      setLoadingTimes(true);
      setSlotsError('');
      getAvailableSlots(selectedProfessional.id, serviceIds, selectedDate)
        .then(times => {
          if (cancelled) return;
          setAvailableTimes(times);
          // Se o horário selecionado deixou de estar disponível (ex: outro
          // cliente acabou de reservá-lo), limpa a seleção para o usuário
          // escolher novamente.
          setSelectedTime(prevTime => (prevTime && !times.includes(prevTime) ? '' : prevTime));
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setAvailableTimes([]);
            setSlotsError(getErrorMessage(err, 'Não foi possível consultar os horários. Tente novamente.'));
          }
        })
        .finally(() => {
          if (!cancelled) setLoadingTimes(false);
        });
    } else {
      setAvailableTimes([]);
      setSlotsError('');
    }

    return () => { cancelled = true; };
  }, [selectedProfessional, selectedDate, selectedServices, getAvailableSlots]);

  const handleNext = () => {
    setErrorMsg('');
    if (step === 1 && selectedServices.length === 0) {
      setErrorMsg('Por favor, selecione pelo menos um serviço.');
      return;
    }
    if (step === 2 && !selectedProfessional) {
      setErrorMsg('Por favor, selecione um profissional.');
      return;
    }
    if (step === 3 && (!selectedDate || !selectedTime)) {
      setErrorMsg('Por favor, selecione uma data e horário.');
      return;
    }
    setStep(s => s + 1);
  };

  const handleBack = () => {
    setErrorMsg('');
    setStep(s => Math.max(1, s - 1));
  };

  const handleConfirm = async () => {
    if (!selectedProfessional || selectedServices.length === 0 || !selectedDate || !selectedTime) return;

    const effectiveName = currentUser?.name?.trim() || custName.trim();
    const effectivePhone = currentUser?.phone?.trim() || custPhone.trim();

    if (!effectiveName || !effectivePhone) {
      setErrorMsg('Por favor, preencha todos os seus dados.');
      return;
    }
    if (!validatePhoneBR(effectivePhone)) {
      setErrorMsg('Por favor, insira um telefone válido, com DDD.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMsg('');

      setProcessingStatus('Salvando agendamento...');
      const bookingData = {
        customerId: currentUser?.id || 'guest',
        customerName: effectiveName,
        customerPhone: effectivePhone,
        professionalId: selectedProfessional.id,
        date: selectedDate,
        time: selectedTime,
        status: 'Aguardando pagamento' as const,
        notes: notes || undefined,
        value: totalPrice,
        serviceId: selectedServices.map(s => s.id).join(","),
        feePaid: false,
      };

      const newBooking = await addBooking(bookingData);
      void notificationService.publish({ type: 'booking.created', payload: newBooking, requestedChannels: ['whatsapp'] });
      setCompletedBooking(newBooking);
      setStep(5);

      if (onSuccess) {
        onSuccess(newBooking.id);
      }
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Erro ao realizar agendamento. O horário pode ter sido reservado.'));
      setIsProcessing(false);
      setSelectedTime('');
      // Atualiza a lista de horários disponíveis, já que o conflito indica
      // que outra pessoa reservou o horário nesse meio-tempo.
      if (selectedProfessional) {
        const serviceIds = selectedServices.map(s => s.id).join(",");
        getAvailableSlots(selectedProfessional.id, serviceIds, selectedDate).then(setAvailableTimes).catch(() => {});
      }
      setStep(3);
    }
  };

  const copyPix = async () => {
    const pixKey = config.pixKey;
    if (!pixKey) return;
    try {
      await navigator.clipboard.writeText(pixKey);
    } catch {
      setErrorMsg('Não foi possível copiar automaticamente. Selecione e copie a chave PIX.');
      return;
    }
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  };

  return {
    step,
    setStep,
    services,
    professionals,
    config,
    currentUser,

    selectedServices,
    totalDuration,
    totalPrice,
    toggleService,

    selectedProfessional,
    selectProfessional,

    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    availableTimes,
    loadingTimes,
    slotsError,

    custName, setCustName,
    custPhone, setCustPhone,
    notes, setNotes,

    errorMsg,
    completedBooking,
    copiedPix,
    copyPix,

    isProcessing,
    processingStatus,

    handleNext,
    handleBack,
    handleConfirm
  };
};
