import type { UserRole } from '../types';

export const USER_ROLES = [
  'owner', 'manager', 'receptionist', 'professional', 'customer', 'admin', 'barber',
] as const satisfies readonly UserRole[];

export function parseUserRole(value: unknown): UserRole {
  if (typeof value !== 'string' || !(USER_ROLES as readonly string[]).includes(value)) {
    throw new Error(`Role de usuário desconhecida: ${String(value)}.`);
  }
  return value as UserRole;
}

/** Legacy DB roles remain accepted only during the versioned role migration. */
export const isAdministratorRole = (role: UserRole | null | undefined): boolean =>
  role === 'owner' || role === 'admin';

export const isProfessionalRole = (role: UserRole | null | undefined): boolean =>
  role === 'professional' || role === 'barber';

export const isCustomerRole = (role: UserRole | null | undefined): boolean => role === 'customer';

export const canAccessProfessionalWorkspace = (role: UserRole | null | undefined): boolean =>
  isAdministratorRole(role) || isProfessionalRole(role);

/** Existing owners must retry onboarding without attempting a second claim. */
export const shouldClaimInstallation = (role: UserRole | null | undefined): boolean =>
  !isAdministratorRole(role);

export const getRoleLabel = (role: UserRole): string => {
  switch (role) {
    case 'owner': return 'Proprietário';
    case 'admin': return 'Administrador';
    case 'manager': return 'Gerente';
    case 'receptionist': return 'Recepção';
    case 'professional':
    case 'barber': return 'Profissional';
    case 'customer': return 'Cliente';
  }
};
