import type { NicheId } from '../../niches/types';
import type { ThemeId } from '../../themes/types';

export type Capability =
  | 'online_booking' | 'customers' | 'professionals' | 'services'
  | 'financial' | 'reports' | 'pets' | 'inventory' | 'whatsapp'
  | 'ai' | 'advanced_themes' | 'custom_domain' | 'loyalty';

export const CAPABILITIES = [
  'online_booking', 'customers', 'professionals', 'services', 'financial',
  'reports', 'pets', 'inventory', 'whatsapp', 'ai', 'advanced_themes',
  'custom_domain', 'loyalty',
] as const satisfies readonly Capability[];

export interface BusinessProfile {
  name: string;
  description?: string;
  logoUrl?: string;
  coverUrl?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  timezone: string;
  currency: string;
  locale: string;
  nicheId: NicheId;
  themeId: ThemeId;
}

export interface BusinessContextValue {
  profile: BusinessProfile;
  capabilities: ReadonlySet<Capability>;
  hasCapability: (capability: Capability) => boolean;
}
