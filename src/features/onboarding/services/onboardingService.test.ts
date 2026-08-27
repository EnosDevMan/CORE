import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.hoisted(() => vi.fn());
vi.mock('../../../lib/supabaseClient', () => ({ supabase: { rpc } }));

import { onboardingService } from './onboardingService';

beforeEach(() => {
  rpc.mockReset();
  rpc.mockResolvedValue({ error: null });
});

describe('onboarding appearance persistence', () => {
  it('sends style, palette and a compatible legacy theme atomically', async () => {
    await onboardingService.complete({
      businessName: 'Barbearia Teste', nicheId: 'barbershop',
      themeStyleId: 'heritage', paletteId: 'copper',
      capabilities: ['online_booking'],
      businessHours: { open: '09:00', close: '18:00', daysOpen: [1] },
      services: [], professionals: [], intervalMinutes: 30, bookingWindowDays: 30,
    }, false);

    expect(rpc).toHaveBeenCalledWith('complete_business_onboarding', expect.objectContaining({
      p_theme_id: 'heritage_copper',
      p_theme_style_id: 'heritage',
      p_palette_id: 'copper',
    }));
  });

  it('rejects an invalid appearance before calling the database', async () => {
    await expect(onboardingService.complete({
      businessName: 'Pet Teste', nicheId: 'pet_shop',
      themeStyleId: 'heritage', paletteId: 'forest',
      capabilities: [], businessHours: { open: '09:00', close: '18:00', daysOpen: [1] },
      services: [], professionals: [], intervalMinutes: 30, bookingWindowDays: 30,
    }, false)).rejects.toThrow(/não está disponível/);
    expect(rpc).not.toHaveBeenCalled();
  });
});
