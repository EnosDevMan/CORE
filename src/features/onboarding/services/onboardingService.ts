import { supabase } from '../../../lib/supabaseClient';
import type { Capability } from '../../../core/business/types';
import type { NicheId } from '../../../niches/types';
import type { ThemeId } from '../../../themes/types';

export interface OnboardingInput {
  businessName: string;
  nicheId: NicheId;
  themeId: ThemeId;
  phone?: string;
  address?: string;
  capabilities: readonly Capability[];
  businessHours: { open: string; close: string; daysOpen: number[] };
  services: readonly { name: string; duration: number; category: string }[];
  professionals: readonly { name: string }[];
  intervalMinutes: number;
  bookingWindowDays: number;
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
    if (shouldClaimOwner) {
      const { error } = await supabase.rpc('claim_first_owner');
      throwError(error);
    }

    const { error } = await supabase.rpc('complete_business_onboarding', {
      p_business_name: input.businessName.trim(),
      p_niche_id: input.nicheId,
      p_theme_id: input.themeId,
      p_phone: input.phone?.trim() || null,
      p_address: input.address?.trim() || null,
      p_capabilities: [...input.capabilities],
      p_business_hours: input.businessHours,
      p_services: input.services,
      p_professionals: input.professionals,
      p_interval_minutes: input.intervalMinutes,
      p_booking_window_days: input.bookingWindowDays,
    });
    throwError(error);
  },
};
