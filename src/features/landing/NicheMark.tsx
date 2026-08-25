import type { ComponentType } from 'react';
import { CalendarDays, PawPrint, Scissors, Sparkles, type LucideProps } from 'lucide-react';
import type { RuntimeNicheId } from '../../niches/types';

const NICHE_ICONS = {
  core_bootstrap: CalendarDays,
  barbershop: Scissors,
  beauty_salon: Sparkles,
  nail_studio: Sparkles,
  pet_shop: PawPrint,
} as const satisfies Record<RuntimeNicheId, ComponentType<LucideProps>>;

export function NicheMark({ nicheId, ...props }: LucideProps & { nicheId: RuntimeNicheId }) {
  const Icon = NICHE_ICONS[nicheId];
  return <Icon {...props} />;
}
