import type { Capability } from '../../core/business/types';
import type { NichePreset } from '../../niches/types';

export type AdminTab =
  | 'overview' | 'new-booking' | 'agenda' | 'clients' | 'reports'
  | 'services' | 'professionals' | 'pets' | 'gallery' | 'settings';

export type AdminNavGroup = 'Operação' | 'Gestão' | 'Cadastros' | 'Sistema';

interface AdminNavigationItem {
  id: AdminTab;
  label: string;
  description: string;
  group: AdminNavGroup;
  capability?: Capability;
}

export function getAdminNavigation(
  niche: NichePreset,
  hasCapability: (capability: Capability) => boolean,
): AdminNavigationItem[] {
  const items: AdminNavigationItem[] = [
    { id: 'overview', label: 'Visão geral', description: 'Resumo e prioridades do dia', group: 'Operação' },
    { id: 'new-booking', label: 'Novo agendamento', description: 'Reserve um horário para o cliente', group: 'Operação', capability: 'online_booking' },
    { id: 'agenda', label: 'Agenda', description: 'Consulte e organize os horários', group: 'Operação', capability: 'online_booking' },
    { id: 'clients', label: niche.customerLabel, description: `Histórico e informações de ${niche.customerLabel.toLowerCase()}`, group: 'Gestão', capability: 'customers' },
    { id: 'reports', label: 'Relatórios', description: 'Indicadores financeiros e desempenho', group: 'Gestão', capability: 'reports' },
    { id: 'services', label: 'Serviços', description: 'Catálogo, duração e preços', group: 'Cadastros', capability: 'services' },
    { id: 'professionals', label: niche.professionalLabel, description: 'Equipe e disponibilidade', group: 'Cadastros', capability: 'professionals' },
    { id: 'pets', label: 'Pets', description: 'Animais, tutores e restrições', group: 'Cadastros', capability: 'pets' },
    { id: 'gallery', label: 'Galeria', description: 'Imagens exibidas no site', group: 'Cadastros' },
    { id: 'settings', label: 'Configurações', description: 'Dados e preferências do negócio', group: 'Sistema' },
  ];

  return items.filter(item => !item.capability || hasCapability(item.capability));
}
