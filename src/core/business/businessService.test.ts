import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  select: vi.fn(),
  selectEq: vi.fn(),
  single: vi.fn(),
  maybeSingle: vi.fn(),
  update: vi.fn(),
  updateEq: vi.fn(),
  uploadImage: vi.fn(),
  removePublicImage: vi.fn(),
}));

vi.mock('../../lib/supabaseClient', () => ({
  supabase: { from: mocks.from },
}));

vi.mock('../../services/storageService', () => ({
  uploadImage: mocks.uploadImage,
  removePublicImage: mocks.removePublicImage,
}));

import { businessService } from './businessService';

const oldUrl = 'https://project.supabase.co/storage/v1/object/public/branding/logos/00000000-0000-4000-8000-000000000001.webp';
const newUrl = 'https://project.supabase.co/storage/v1/object/public/branding/logos/00000000-0000-4000-8000-000000000002.webp';

const runtimeRow = (businessName: string) => ({
  id: true,
  business_name: businessName,
  description: null,
  logo_url: null,
  cover_url: null,
  phone: '83996822057',
  whatsapp: '83996822057',
  address: { formatted: 'Rua Teste 123' },
  timezone: 'America/Sao_Paulo',
  currency: 'BRL',
  locale: 'pt-BR',
  niche_id: 'barbershop',
  theme_id: 'minimal_light',
  theme_style_id: 'minimal',
  palette_id: 'minimal_white',
  surface_mode: 'light',
  custom_primary_color: null,
  custom_secondary_color: null,
  custom_accent_color: null,
  onboarding_completed: true,
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.from.mockReturnValue({ select: mocks.select, update: mocks.update });
  mocks.select.mockReturnValue({ eq: mocks.selectEq });
  mocks.selectEq.mockReturnValue({ single: mocks.single, maybeSingle: mocks.maybeSingle });
  mocks.single.mockResolvedValue({ data: { logo_url: oldUrl, favicon_url: oldUrl }, error: null });
  mocks.maybeSingle.mockResolvedValue({ data: runtimeRow('Negócio Inicial'), error: null });
  mocks.update.mockReturnValue({ eq: mocks.updateEq });
  mocks.updateEq.mockResolvedValue({ error: null });
  mocks.uploadImage.mockResolvedValue(newUrl);
  mocks.removePublicImage.mockResolvedValue(undefined);
});

describe('business runtime refresh', () => {
  it('bypasses the bootstrap cache after a confirmed owner mutation', async () => {
    mocks.maybeSingle.mockResolvedValueOnce({ data: runtimeRow('Nome Antes'), error: null });
    const initial = await businessService.refreshRuntime();
    expect(initial?.profile.name).toBe('Nome Antes');

    const cached = await businessService.getRuntime();
    expect(cached?.profile.name).toBe('Nome Antes');
    expect(mocks.maybeSingle).toHaveBeenCalledTimes(1);

    mocks.maybeSingle.mockResolvedValueOnce({ data: runtimeRow('Nome Depois'), error: null });
    const refreshed = await businessService.refreshRuntime();

    expect(refreshed?.profile.name).toBe('Nome Depois');
    expect(mocks.maybeSingle).toHaveBeenCalledTimes(2);
  });
});

describe('business logo persistence', () => {
  it('publishes a unique logo, updates favicon and removes the previous asset', async () => {
    const file = new File(['brand'], 'brand.webp', { type: 'image/webp' });

    await businessService.replaceLogo(file);

    expect(mocks.uploadImage).toHaveBeenCalledWith(
      file,
      expect.stringMatching(/^logos\/[0-9a-f-]{36}\.webp$/),
      'branding',
    );
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ logo_url: newUrl, favicon_url: newUrl }));
    expect(mocks.removePublicImage).toHaveBeenCalledWith(oldUrl, 'branding');
  });

  it('rolls back the newly uploaded object when the profile update fails', async () => {
    mocks.updateEq.mockResolvedValue({ error: { message: 'update denied' } });
    const file = new File(['brand'], 'brand.webp', { type: 'image/webp' });

    await expect(businessService.replaceLogo(file)).rejects.toThrow('update denied');

    expect(mocks.removePublicImage).toHaveBeenCalledTimes(1);
    expect(mocks.removePublicImage).toHaveBeenCalledWith(newUrl, 'branding');
  });

  it('clears both profile fields before cleaning up the stored logo', async () => {
    await businessService.removeLogo();

    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ logo_url: null, favicon_url: null }));
    expect(mocks.removePublicImage).toHaveBeenCalledWith(oldUrl, 'branding');
  });

  it('cleans distinct legacy logo and favicon objects without duplicating equal URLs', async () => {
    const faviconUrl = 'https://project.supabase.co/storage/v1/object/public/branding/logos/00000000-0000-4000-8000-000000000005.webp';
    mocks.single.mockResolvedValue({ data: { logo_url: oldUrl, favicon_url: faviconUrl }, error: null });

    await businessService.removeLogo();

    expect(mocks.removePublicImage).toHaveBeenCalledTimes(2);
    expect(mocks.removePublicImage).toHaveBeenCalledWith(oldUrl, 'branding');
    expect(mocks.removePublicImage).toHaveBeenCalledWith(faviconUrl, 'branding');
  });
});

describe('business appearance persistence', () => {
  it('writes style, palette and the legacy alias together', async () => {
    await businessService.updateAppearance({ styleId: 'heritage', paletteId: 'copper' }, 'barbershop');
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      theme_id: 'heritage_copper',
      theme_style_id: 'heritage',
      palette_id: 'copper',
    }));
  });

  it('rejects an invalid niche combination before reaching Supabase', async () => {
    await expect(businessService.updateAppearance({ styleId: 'heritage', paletteId: 'forest' }, 'pet_shop'))
      .rejects.toThrow(/não está disponível/);
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
