import { NICHE_REGISTRY } from '../../niches/registry';
import type { NicheId } from '../../niches/types';
import { getLegacyThemeIdForAppearance, resolveAppearanceForNiche } from '../../themes/appearance';
import { LEGACY_THEME_APPEARANCE } from '../../themes/compatibility';
import type { LegacyThemeId } from '../../themes/types';
import { getBusinessNow } from '../../utils/validation';
import { CAPABILITIES, type BusinessProfile, type Capability } from './types';

type RuntimeRow = Record<string, unknown>;

const optionalString = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value : undefined;

function requiredString(row: RuntimeRow, key: string): string {
  const value = optionalString(row[key]);
  if (!value) throw new Error(`Perfil do negócio inválido: ${key}.`);
  return value;
}

export function mapBusinessProfile(value: unknown): BusinessProfile {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('O banco retornou um perfil de negócio inválido.');
  }

  const row = value as RuntimeRow;
  const nicheId = requiredString(row, 'niche_id');
  const persistedThemeId = optionalString(row.theme_id);
  const timezone = requiredString(row, 'timezone');
  if (!(nicheId in NICHE_REGISTRY)) throw new Error(`Nicho desconhecido: ${nicheId}.`);
  getBusinessNow(timezone, new Date(0));

  const typedNicheId = nicheId as NicheId;
  const appearance = resolveAppearanceForNiche(typedNicheId, {
    styleId: row.theme_style_id,
    paletteId: row.palette_id,
    legacyThemeId: persistedThemeId,
  });
  const themeId = persistedThemeId && persistedThemeId in LEGACY_THEME_APPEARANCE
    ? persistedThemeId as LegacyThemeId
    : getLegacyThemeIdForAppearance(typedNicheId, appearance.styleId, appearance.paletteId);

  const address = row.address;
  const formattedAddress = address && typeof address === 'object' && !Array.isArray(address)
    ? optionalString((address as RuntimeRow).formatted)
    : undefined;

  return {
    name: requiredString(row, 'business_name'),
    description: optionalString(row.description),
    logoUrl: optionalString(row.logo_url),
    faviconUrl: optionalString(row.favicon_url),
    coverUrl: optionalString(row.cover_url),
    phone: optionalString(row.phone),
    whatsapp: optionalString(row.whatsapp),
    email: optionalString(row.email),
    address: formattedAddress,
    timezone,
    currency: requiredString(row, 'currency'),
    locale: requiredString(row, 'locale'),
    nicheId: typedNicheId,
    themeId,
    themeStyleId: appearance.styleId,
    paletteId: appearance.paletteId,
  };
}

export function mapCapabilities(value: unknown): Capability[] {
  if (!Array.isArray(value)) throw new Error('O banco retornou capabilities inválidas.');
  const allowed = new Set<string>(CAPABILITIES);
  const capabilities = value.map(item => {
    const capability = item && typeof item === 'object'
      ? (item as RuntimeRow).capability
      : undefined;
    if (typeof capability !== 'string' || !allowed.has(capability)) {
      throw new Error(`Capability desconhecida: ${String(capability)}.`);
    }
    return capability as Capability;
  });
  return [...new Set(capabilities)];
}
