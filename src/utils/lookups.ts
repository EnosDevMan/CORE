import { Service, Professional } from '../types';

/**
 * Resolve o nome de um ou mais serviços a partir do `serviceId` gravado no
 * agendamento (pode ser uma lista separada por vírgula, ex: "svc1,svc2",
 * quando o cliente seleciona mais de um serviço).
 *
 * Esta lógica estava duplicada, com pequenas variações, em
 * useAdminDashboard, useCustomerDashboard, useProfessionalDashboard e
 * AdminAgendaTab. Centralizada aqui (DRY) — qualquer ajuste futuro no
 * critério de exibição só precisa ser feito em um lugar.
 */
export function getServiceName(services: Service[], id: string): string {
  if (!id) return 'Desconhecido';
  const names = id
    .split(',')
    .map(subId => services.find(s => s.id === subId.trim())?.name)
    .filter((n): n is string => Boolean(n));
  return names.length ? names.join(' + ') : 'Desconhecido';
}

/** Resolve o nome de um profissional pelo id. Mesma duplicação de getServiceName. */
export function getProfessionalName(professionals: Professional[], id: string): string {
  return professionals.find(professional => professional.id === id)?.name || 'Desconhecido';
}
