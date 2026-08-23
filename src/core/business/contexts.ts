import { createContext } from 'react';
import type { NichePreset } from '../../niches/types';
import type { ThemePreset } from '../../themes/types';
import type { BusinessContextValue } from './types';

export const BusinessContext = createContext<BusinessContextValue | null>(null);
export const NicheContext = createContext<NichePreset | null>(null);
export const ThemeContext = createContext<ThemePreset | null>(null);

