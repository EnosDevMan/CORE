import type { RuntimeNicheId } from '../../niches/types';
import type { ThemeStyleId } from '../../layouts/types';
import type {
  CustomPaletteColors,
  LegacyThemeId,
  PaletteSelectionId,
  SurfaceMode,
} from '../../themes/types';

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
  faviconUrl?: string;
  coverUrl?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  timezone: string;
  currency: string;
  locale: string;
  nicheId: RuntimeNicheId;
  /** Stable alias retained for older clients and database compatibility. */
  themeId: LegacyThemeId;
  /** High-level composition / art-direction family. */
  themeStyleId: ThemeStyleId;
  /** Curated brand family or owner-defined custom colours. */
  paletteId: PaletteSelectionId;
  /** Surface luminosity is independent from the brand palette. Runtime rows always resolve it; optional keeps old in-memory consumers compatible. */
  surfaceMode?: SurfaceMode;
  customPalette?: CustomPaletteColors;
}

export interface BusinessContextValue {
  profile: BusinessProfile;
  /** True only after the business onboarding has been completed and published. */
  configured: boolean;
  capabilities: ReadonlySet<Capability>;
  hasCapability: (capability: Capability) => boolean;
  /** Reloads the persisted business runtime after an owner-level configuration change. */
  refreshRuntime: () => Promise<void>;
}
