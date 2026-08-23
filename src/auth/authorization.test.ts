import { describe, expect, it } from 'vitest';
import {
  canAccessProfessionalWorkspace,
  getRoleLabel,
  isAdministratorRole,
  isProfessionalRole,
  parseUserRole,
  shouldClaimInstallation,
} from './authorization';

describe('authorization roles', () => {
  it('keeps legacy roles compatible during migration', () => {
    expect(isAdministratorRole('admin')).toBe(true);
    expect(isProfessionalRole('barber')).toBe(true);
  });

  it('recognizes canonical owner and professional roles', () => {
    expect(isAdministratorRole('owner')).toBe(true);
    expect(isProfessionalRole('professional')).toBe(true);
    expect(canAccessProfessionalWorkspace('professional')).toBe(true);
    expect(canAccessProfessionalWorkspace('customer')).toBe(false);
    expect(shouldClaimInstallation('owner')).toBe(false);
    expect(shouldClaimInstallation('admin')).toBe(false);
    expect(shouldClaimInstallation('customer')).toBe(true);
  });

  it('uses niche-neutral labels', () => {
    expect(getRoleLabel('barber')).toBe('Profissional');
    expect(getRoleLabel('receptionist')).toBe('Recepção');
  });

  it('rejects unknown database roles at the boundary', () => {
    expect(parseUserRole('owner')).toBe('owner');
    expect(() => parseUserRole('super_admin')).toThrow(/desconhecida/);
    expect(() => parseUserRole(null)).toThrow(/desconhecida/);
  });
});
