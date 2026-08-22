import { useContext } from 'react';
import { BusinessContext, NicheContext, ThemeContext } from './contexts';

function required<T>(value: T | null, hookName: string): T {
  if (!value) {
    throw new Error(`${hookName} deve ser usado dentro de BusinessProvider.`);
  }

  return value;
}

export const useBusiness = () => required(useContext(BusinessContext), 'useBusiness');
export const useOptionalBusiness = () => useContext(BusinessContext);
export const useNiche = () => required(useContext(NicheContext), 'useNiche');
export const useTheme = () => required(useContext(ThemeContext), 'useTheme');
