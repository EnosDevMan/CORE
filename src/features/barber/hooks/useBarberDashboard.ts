import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../../store/useApp';
import { BookingStatus, Booking } from '../../../types';
import { getBarbershopTodayStr, formatBRL } from '../../../utils/validation';
import { buildWhatsAppLink } from '../../../utils/whatsapp';
import { getServiceName as getSharedServiceName } from '../../../utils/lookups';
import { getErrorMessage } from '../../../utils/errors';

export const useBarberDashboard = () => {
  const {
    bookings,
    services,
    barbers,
    currentUser,
    updateBookingStatus,
    updateBarber,
    config,
  } = useApp();

  const [activeBarberId, setActiveBarberId] = useState<string>(currentUser?.profileId || '');
  const [statsPeriod, setStatsPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Mesmo padrão do AdminDashboard (ver useAdminDashboard.ts): avisos de
  // sucesso/erro somem sozinhos depois de 5s.
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
        setErrorMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  const showFeedback = (msg: string, isError: boolean = false) => {
    if (isError) {
      setErrorMessage(msg);
      setSuccessMessage('');
    } else {
      setSuccessMessage(msg);
      setErrorMessage('');
    }
  };

  useEffect(() => {
    if (currentUser?.profileId) {
      setActiveBarberId(currentUser.profileId);
    }
  }, [currentUser]);

  // Modo de simulação (conta não vinculada a um barbeiro específico, ex:
  // admin visualizando "como se fosse" um barbeiro): antes, o id ativo
  // caía num placeholder fixo ('b1') que nunca corresponde a um UUID real
  // de `barbers`, deixando o <select> com um valor sem opção
  // correspondente (visualmente mostrava o 1º barbeiro, mas o estado
  // continuava em 'b1', então agenda/estatísticas ficavam vazias até o
  // usuário reselecionar manualmente o mesmo item). Agora, assim que a
  // lista de barbeiros carrega, escolhemos o primeiro barbeiro ativo real
  // como padrão (mantendo a seleção atual se ainda for válida).
  useEffect(() => {
    if (currentUser?.profileId || barbers.length === 0) return;
    setActiveBarberId(prev => (prev && barbers.some(b => b.id === prev) ? prev : barbers[0].id));
  }, [currentUser, barbers]);

  const activeBarber = barbers.find(b => b.id === activeBarberId);
  const barberBookings = bookings.filter(b => b.barberId === activeBarberId);

  // Usa a data "de hoje" no fuso horário da barbearia (não o fuso do
  // dispositivo do barbeiro). Antes, isto usava new Date() local, o que
  // podia classificar erroneamente agendamentos de "hoje" como passados ou
  // futuros caso o dispositivo do barbeiro estivesse em outro fuso horário.
  const todayStr = useMemo(() => getBarbershopTodayStr(), []);

  const sortedBookings = useMemo(() => {
    return [...barberBookings].sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return a.time.localeCompare(b.time);
    });
  }, [barberBookings]);

  const todayBookings = sortedBookings.filter(b => b.date === todayStr);
  // "Cancelado" fica de fora destas duas listas: não há nada a fazer numa
  // reserva futura cancelada, e um cancelamento não é um "trabalho
  // realizado" no histórico. Continua existindo na base de dados/relatórios
  // do admin, só não polui a visão operacional do dia a dia do barbeiro.
  const futureBookings = sortedBookings.filter(b => b.date > todayStr && b.status !== 'Cancelado');
  const pastBookings = sortedBookings.filter(b => b.date < todayStr && b.status !== 'Cancelado');

  const completedToday = todayBookings.filter(b => b.status === 'Concluído').length;
  const pendingToday = todayBookings.filter(b => b.status === 'Confirmado' || b.status === 'Em atendimento' || b.status === 'Aguardando pagamento').length;

  const getServiceName = (id: string) => getSharedServiceName(services, id);

  // Usa `booking.value` (o valor efetivamente cobrado, congelado no momento
  // do agendamento) em vez de recalcular pelo preço ATUAL do serviço — o
  // mesmo padrão já usado nos relatórios do admin (useAdminReports.ts).
  // Antes, se o preço de um serviço mudasse (ou o serviço fosse excluído),
  // todo o histórico de faturamento do barbeiro mudava retroativamente e
  // podia ficar diferente do relatório oficial do admin.
  const totalEarnings = barberBookings
    .filter(b => b.status === 'Concluído')
    .reduce((sum, b) => sum + b.value, 0);

  const isSameDay = (dateStr: string) => dateStr === todayStr;
  const isThisWeek = (dateStr: string) => {
    // "Hoje" de referência sempre no fuso horário da barbearia (todayStr),
    // não no fuso do dispositivo do barbeiro.
    const today = new Date(todayStr + 'T00:00:00');
    const bookingDate = new Date(dateStr + 'T00:00:00');
    const currentDay = today.getDay();
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() + diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return bookingDate >= startOfWeek && bookingDate <= endOfWeek;
  };
  const isThisMonth = (dateStr: string) => {
    const [todayYear, todayMonth] = todayStr.split('-');
    const [year, month] = dateStr.split('-');
    return parseInt(year) === parseInt(todayYear) && parseInt(month) === parseInt(todayMonth);
  };

  const periodBookings = barberBookings.filter(b => {
    if (b.status !== 'Concluído') return false;
    if (statsPeriod === 'day') return isSameDay(b.date);
    if (statsPeriod === 'week') return isThisWeek(b.date);
    if (statsPeriod === 'month') return isThisMonth(b.date);
    return false;
  });

  const serviceStats: { [serviceId: string]: { name: string; count: number; totalValue: number } } = {};
  let totalPeriodValue = 0;

  periodBookings.forEach(booking => {
    if (!booking.serviceId) return;
    const sIds = booking.serviceId.split(',').map(id => id.trim()).filter(Boolean);
    if (sIds.length === 0) return;
    // Quando o agendamento combina mais de um serviço, dividimos o valor
    // (histórico, real) igualmente entre eles para a soma do detalhamento
    // continuar batendo com o faturamento total do período — mesmo padrão
    // usado em useAdminReports.ts (serviceBreakdown).
    const share = booking.value / sIds.length;
    sIds.forEach(id => {
      const serviceObj = services.find(s => s.id === id);
      const name = serviceObj?.name || getServiceName(id);
      if (!serviceStats[id]) {
        serviceStats[id] = { name, count: 0, totalValue: 0 };
      }
      serviceStats[id].count += 1;
      serviceStats[id].totalValue += share;
      totalPeriodValue += share;
    });
  });

  const serviceStatsList = Object.entries(serviceStats)
    .map(([id, s]) => ({ id, ...s }))
    .sort((a, b) => b.totalValue - a.totalValue);

  const handleStatusChange = async (bookingId: string, status: BookingStatus) => {
    try {
      await updateBookingStatus(bookingId, status);
      showFeedback(`Agendamento ${status.toLowerCase()} com sucesso!`, false);
    } catch (err) {
      showFeedback(getErrorMessage(err, 'Erro ao atualizar agendamento.'), true);
    }
  };

  const getStatusBadgeColor = (status: BookingStatus) => {
    switch (status) {
      case 'Aguardando pagamento': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Confirmado': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Em atendimento': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Concluído': return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'Cancelado': return 'bg-red-100 text-red-800 border-red-200';
      case 'Não compareceu': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Reagendado': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getFormattedDate = (dateStr: string) => {
    const dateObj = new Date(dateStr + 'T00:00:00');
    return dateObj.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const getWhatsAppLink = (booking: Booking) => {
    const serviceName = getServiceName(booking.serviceId);
    const barberName = barbers.find(b => b.id === booking.barberId)?.name || 'Barbeiro';
    const formattedDate = getFormattedDate(booking.date);
    const feeLabel = formatBRL(config.bookingFee);

    let message = '';
    if (booking.status === 'Aguardando pagamento') {
      // A chave de recebimento é única e pertence à configuração global.
      // Barbeiros não escolhem nem substituem o destino do pagamento.
      const pixKey = config.pixKey || '';
      const pixSection = pixKey
        ? `Para confirmar o seu horário, faça o PIX para a chave:\n*${pixKey}*\n\n*(Aviso: A taxa de reserva de ${feeLabel} garante o seu horário e não é reembolsável em caso de cancelamento).* Envie o comprovante de pagamento respondendo a esta mensagem.`
        : `Em breve entraremos em contato com os dados para o pagamento da taxa de reserva de ${feeLabel}.`;
      message = `Olá, *${booking.customerName}*! Tudo bem?\n\nSeu agendamento na *${config.name}* para o dia *${formattedDate}* às *${booking.time}h* com o profissional *${barberName}* está aguardando o pagamento da taxa de reserva de *${feeLabel}*.\n\n${pixSection} Obrigado! 💈`;
    } else if (booking.status === 'Confirmado') {
      message = `Olá, *${booking.customerName}*! Passando para confirmar que seu agendamento na *${config.name}* está *CONFIRMADO*!\n\n*Serviço:* ${serviceName}\n*Data:* ${formattedDate}\n*Horário:* ${booking.time}h\n*Profissional:* ${barberName}\n\nEstamos ansiosos para receber você! *(Lembrando que a taxa de reserva de ${feeLabel} garante a reserva do profissional e não é reembolsável em caso de cancelamento).* Se precisar reagendar, entre em contato com antecedência. Abraço! 💈`;
    } else {
      message = `Olá, *${booking.customerName}*! Tudo bem? Estou entrando em contato referente ao seu agendamento na *${config.name}* para o dia *${formattedDate}* às *${booking.time}h* com o profissional *${barberName}*. 💈`;
    }
    return buildWhatsAppLink(booking.customerPhone, message);
  };

  return {
    currentUser,
    barbers,
    activeBarberId,
    setActiveBarberId,
    activeBarber,
    todayBookings,
    futureBookings,
    pastBookings,
    completedToday,
    pendingToday,
    totalEarnings,
    statsPeriod,
    setStatsPeriod,
    serviceStatsList,
    totalPeriodValue,
    handleStatusChange,
    getStatusBadgeColor,
    getFormattedDate,
    getWhatsAppLink,
    getServiceName,
    formatBRL,
    config,
    barberBookings,
    updateBarber,
    successMessage,
    setSuccessMessage,
    errorMessage,
    setErrorMessage,
    showFeedback
  };
};
