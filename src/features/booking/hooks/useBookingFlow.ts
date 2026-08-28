import { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../../../store/useApp';
import { Service, Booking } from '../../../types';
import type { Professional } from '../../professionals/types';
import { getBusinessTodayStr, validatePhoneBR } from '../../../utils/validation';
import { useBusiness } from '../../../core/business/hooks';
import { getErrorMessage } from '../../../utils/errors';
import { notificationService } from '../../../services/notificationService';
import { useBusinessToday } from '../../../hooks/useBusinessToday';

export const useBookingFlow = (onSuccess?: (bookingId: string) => void, initialServiceId?: string, initialProfessionalId?: string) => {
  const { services: allServices, professionals: allProfessionals, config, currentUser, getAvailableSlots, addBooking } = useApp();
  const { profile } = useBusiness();
  const businessToday = useBusinessToday(profile.timezone);
  // Profissionais desativados (active=false) não podem ser selecionados no
  // fluxo público de agendamento — antes, "desativar" um profissional não
  // tinha nenhum efeito aqui e ele continuava aparecendo para reserva.
  const services = useMemo(() => allServices.filter(s => s.active !== false), [allServices]);
  const professionals = useMemo(() => allProfessionals.filter(b => b.active !== false), [allProfessionals]);
  const professionalStepRequired = professionals.length !== 1;

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
  const processingRef = useRef(false);

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
    if (selectedDate < businessToday) {
      setSelectedDate(businessToday);
      setSelectedTime('');
    }
  }, [businessToday, selectedDate]);

  // A loja com um único profissional não precisa pedir uma escolha óbvia.
  // Mantemos a seleção sincronizada para que a disponibilidade já esteja
  // pronta quando o cliente chegar à etapa de data e horário.
  useEffect(() => {
    if (professionals.length === 1 && selectedProfessional?.id !== professionals[0].id) {
      setSelectedProfessional(professionals[0]);
      setSelectedTime('');
    }
  }, [professionals, selectedProfessional?.id]);

  useEffect(() => {
    let cancelled = false;
    let requestVersion = 0;
    let refreshInterval: ReturnType<typeof setInterval> | undefined;

    if (selectedProfessional && selectedDate && selectedServices.length > 0) {
      const serviceIds = selectedServices.map(s => s.id).join(",");
      setLoadingTimes(true);
      setSlotsError('');

      const refreshAvailability = () => {
        const version = ++requestVersion;
        getAvailableSlots(selectedProfessional.id, serviceIds, selectedDate)
          .then(times => {
            if (cancelled || version !== requestVersion) return;
            setAvailableTimes(times);
            setSlotsError('');
            // Remove imediatamente horários escolhidos por outros clientes.
            setSelectedTime(prevTime => (prevTime && !times.includes(prevTime) ? '' : prevTime));
          })
          .catch((err: unknown) => {
            if (!cancelled && version === requestVersion) {
              setAvailableTimes([]);
              setSlotsError(getErrorMessage(err, 'Não foi possível consultar os horários. Tente novamente.'));
            }
          })
          .finally(() => {
            if (!cancelled && version === requestVersion) setLoadingTimes(false);
          });
      };

      refreshAvailability();
      refreshInterval = setInterval(refreshAvailability, 15_000);
    } else {
      setAvailableTimes([]);
      setSlotsError('');
      setLoadingTimes(false);
    }

    return () => {
      cancelled = true;
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [selectedProfessional, selectedDate, selectedServices, getAvailableSlots]);

  const handleNext = () => {
    setErrorMsg('');
    if (step === 1 && selectedServices.length === 0) {
      setErrorMsg('Por favor, selecione pelo menos um serviço.');
      return;
    }
    if (step === 1 && professionals.length === 1) {
      setSelectedProfessional(professionals[0]);
      setStep(3);
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
    if (step === 3 && professionals.length === 1) {
      setStep(1);
      return;
    }
    setStep(s => Math.max(1, s - 1));
  };

  const handleConfirm = async () => {
    if (processingRef.current) return;
    if (!selectedProfessional || selectedServices.length === 0 || !selectedDate || !selectedTime) return;

    const effectiveName = currentUser?.name?.trim() || custName.trim();
    const effectivePhone = currentUser?.phone?.trim() || custPhone.trim();

    if (!effectiveName || !effectivePhone) {
      setErrorMsg('Por favor, preencha todos os seus dados.');
      return;
    }
    if (effectiveName.length < 2 || effectiveName.length > 100) {
      setErrorMsg('Seu nome deve ter entre 2 e 100 caracteres.');
      return;
    }
    if (!validatePhoneBR(effectivePhone)) {
      setErrorMsg('Por favor, insira um telefone válido, com DDD.');
      return;
    }
    if (notes.trim().length > 1000) {
      setErrorMsg('A observação deve ter no máximo 1000 caracteres.');
      return;
    }

    processingRef.current = true;
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
        notes: notes.trim() || undefined,
        value: totalPrice,
        serviceId: selectedServices.map(s => s.id).join(","),
        feePaid: false,
      };

      const newBooking = await addBooking(bookingData);
      void notificationService.publish({ type: 'booking.created', payload: newBooking, requestedChannels: ['whatsapp'] });
      setCompletedBooking(newBooking);
      setStep(5);

      if (onSuccess) {
        // Uma integração opcional não pode transformar um agendamento já
        // persistido em aparente falha nem mandar o cliente tentar de novo.
        try {
          onSuccess(newBooking.id);
        } catch (callbackError) {
          console.error('Falha no callback pós-agendamento:', callbackError);
        }
      }
    } catch (err) {
      processingRef.current = false;
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
    professionalStepRequired,
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
