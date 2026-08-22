import { useState, useEffect } from 'react';
import { useApp } from '../../../store/useApp';
import { LayoutDashboard, BarChart3, CalendarDays, CalendarPlus, Scissors, Users, Settings, Camera } from 'lucide-react';
import { formatBRL } from '../../../utils/validation';
import { getErrorMessage } from '../../../utils/errors';
import { getServiceName as getSharedServiceName, getBarberName as getSharedBarberName } from '../../../utils/lookups';
import { BookingStatus } from '../../../types';

export const useAdminDashboard = () => {
  const { config, currentUser, barbers, services, updateBookingStatus } = useApp();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'new-booking' | 'reports' | 'services' | 'barbers' | 'gallery' | 'clients' | 'agenda' | 'settings'>('overview');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const handleUpdateBookingStatus = async (id: string, newStatus: BookingStatus) => {
    try {
      await updateBookingStatus(id, newStatus);
      showFeedback(`Agendamento ${newStatus.toLowerCase()} com sucesso!`, false);
    } catch (err) {
      showFeedback(getErrorMessage(err, 'Erro ao atualizar agendamento.'), true);
    }
  };

  const getBarberName = (id: string) => getSharedBarberName(barbers, id);

  const getServiceName = (id: string) => getSharedServiceName(services, id);

  const navItems = [
    { id: 'overview', label: 'Visão geral', description: 'Resumo e prioridades do dia', group: 'Operação', icon: LayoutDashboard },
    { id: 'new-booking', label: 'Novo agendamento', description: 'Reserve um horário para o cliente', group: 'Operação', icon: CalendarPlus },
    { id: 'agenda', label: 'Agenda', description: 'Consulte e organize os horários', group: 'Operação', icon: CalendarDays },
    { id: 'clients', label: 'Clientes', description: 'Histórico e informações dos clientes', group: 'Gestão', icon: Users },
    { id: 'reports', label: 'Relatórios', description: 'Indicadores financeiros e desempenho', group: 'Gestão', icon: BarChart3 },
    { id: 'services', label: 'Serviços', description: 'Catálogo, duração e preços', group: 'Cadastros', icon: Scissors },
    { id: 'barbers', label: 'Profissionais', description: 'Equipe e disponibilidade', group: 'Cadastros', icon: Users },
    { id: 'gallery', label: 'Galeria', description: 'Imagens exibidas no site', group: 'Cadastros', icon: Camera },
    { id: 'settings', label: 'Configurações', description: 'Dados e preferências da barbearia', group: 'Sistema', icon: Settings },
  ] as const;

  return {
    config,
    currentUser,
    activeTab,
    setActiveTab,
    successMessage,
    setSuccessMessage,
    errorMessage,
    setErrorMessage,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    showFeedback,
    handleUpdateBookingStatus,
    getBarberName,
    getServiceName,
    formatBRL,
    navItems
  };
};
