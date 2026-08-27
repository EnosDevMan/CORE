import { createContext } from 'react';
import type { NichePreset, RuntimeNicheId } from '../../niches/types';
import type { ResolvedTheme } from '../../themes/types';
import type { BusinessContextValue } from './types';

export const BusinessContext = createContext<BusinessContextValue | null>(null);
export const NicheContext = createContext<NichePreset<RuntimeNicheId> | null>(null);
export const ThemeContext = createContext<ResolvedTheme | null>(null);
