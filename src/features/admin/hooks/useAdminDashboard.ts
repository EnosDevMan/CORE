import { useState, useEffect } from 'react';
import { useApp } from '../../../store/useApp';
import { LayoutDashboard, BarChart3, CalendarDays, CalendarPlus, Scissors, Users, Settings, Camera, PawPrint, ShieldCheck } from 'lucide-react';
import { formatBRL } from '../../../utils/validation';
import { getErrorMessage } from '../../../utils/errors';
import { getServiceName as getSharedServiceName, getProfessionalName as getSharedProfessionalName } from '../../../utils/lookups';
import { BookingStatus } from '../../../types';
import { useBusiness, useNiche } from '../../../core/business/hooks';
import { getAdminNavigation, type AdminTab } from '../navigation';

export const useAdminDashboard = () => {
  const { config, currentUser, professionals, services, updateBookingStatus } = useApp();
  const niche = useNiche();
  const { hasCapability } = useBusiness();
  
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
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

  const getProfessionalName = (id: string) => getSharedProfessionalName(professionals, id);

  const getServiceName = (id: string) => getSharedServiceName(services, id);

  const icons = { overview: LayoutDashboard, 'new-booking': CalendarPlus, agenda: CalendarDays,
    clients: Users, reports: BarChart3, services: Scissors, professionals: Users,
    pets: PawPrint, gallery: Camera, accounts: ShieldCheck, settings: Settings } as const;
  const navItems = getAdminNavigation(niche, hasCapability)
    .map(item => ({ ...item, icon: icons[item.id] }));

  useEffect(() => {
    if (!navItems.some(item => item.id === activeTab)) setActiveTab('overview');
  }, [activeTab, navItems]);

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
    getProfessionalName,
    getServiceName,
    formatBRL,
    navItems
    , niche
  };
};
