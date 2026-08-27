import { supabase } from '../../../lib/supabaseClient';
import type { Capability } from '../../../core/business/types';
import type { ThemeStyleId } from '../../../layouts/types';
import type { NicheId } from '../../../niches/types';
import { getLegacyThemeIdForAppearance, isAppearanceAvailableForNiche } from '../../../themes/appearance';
import type { PaletteId } from '../../../themes/types';

export interface OnboardingInput {
  businessName: string;
  nicheId: NicheId;
  themeStyleId: ThemeStyleId;
  paletteId: PaletteId;
  phone?: string;
  address?: string;
  capabilities: readonly Capability[];
  businessHours: { open: string; close: string; daysOpen: number[] };
  services: readonly { name: string; duration: number; price: number; category: string }[];
  professionals: readonly { name: string }[];
  intervalMinutes: number;
  bookingWindowDays: number;
  ownerSetupCode?: string;
}

export interface OnboardingState {
  completed: boolean;
  ownerExists: boolean;
}

const throwError = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

export const onboardingService = {
  async getState(): Promise<OnboardingState> {
    const { data, error } = await supabase.rpc('get_onboarding_state');
    throwError(error);
    if (!data || typeof data.completed !== 'boolean' || typeof data.ownerExists !== 'boolean') {
      throw new Error('O banco retornou um estado de onboarding inválido.');
    }
    return data as OnboardingState;
  },

  async complete(input: OnboardingInput, shouldClaimOwner: boolean): Promise<void> {
    if (!isAppearanceAvailableForNiche(input.nicheId, input.themeStyleId, input.paletteId)) {
      throw new Error('A aparência escolhida não está disponível para este nicho.');
    }
    let setupCode: string | null = null;
    if (shouldClaimOwner) {
      setupCode = input.ownerSetupCode?.trim().toLowerCase() ?? null;
      if (!setupCode || !/^[a-f0-9]{64}$/i.test(setupCode)) {
        throw new Error('Informe o código de instalação gerado no painel do Supabase.');
      }
    }

    // O código do primeiro proprietário e toda a configuração são enviados
    // à mesma RPC. Assim, o código só é consumido se o onboarding inteiro
    // for concluído; qualquer falha desfaz a transação completa.
    const { error } = await supabase.rpc('complete_business_onboarding', {
      p_business_name: input.businessName.trim(),
      p_niche_id: input.nicheId,
      p_theme_id: getLegacyThemeIdForAppearance(input.nicheId, input.themeStyleId, input.paletteId),
      p_theme_style_id: input.themeStyleId,
      p_palette_id: input.paletteId,
      p_phone: input.phone?.trim() || null,
      p_address: input.address?.trim() || null,
      p_capabilities: [...input.capabilities],
      p_business_hours: input.businessHours,
      p_services: input.services,
      p_professionals: input.professionals,
      p_interval_minutes: input.intervalMinutes,
      p_booking_window_days: input.bookingWindowDays,
      p_setup_code: setupCode,
    });
    throwError(error);
  },
};
