import { useEffect, useMemo, type CSSProperties, type ReactNode } from 'react';
import { getNichePreset } from '../../niches/registry';
import { getThemePreset, toCssVariables } from '../../themes/registry';
import type { BusinessContextValue, BusinessProfile, Capability } from './types';
import { BusinessContext, NicheContext, ThemeContext } from './contexts';
import { applyBusinessMetadata } from './metadata';

interface BusinessProviderProps {
  profile: BusinessProfile;
  capabilities?: readonly Capability[];
  configured?: boolean;
  refreshRuntime?: () => Promise<void>;
  children: ReactNode;
}

const noopRefresh = async () => undefined;

export function BusinessProvider({
  profile,
  capabilities,
  configured = true,
  refreshRuntime = noopRefresh,
  children,
}: BusinessProviderProps) {
  const niche = getNichePreset(profile.nicheId);
  const theme = getThemePreset(profile.themeId);
  const themeStyle = toCssVariables(theme) as CSSProperties;
  const value = useMemo<BusinessContextValue>(() => {
    const enabled = new Set(capabilities ?? niche.recommendedCapabilities);
    return {
      profile,
      configured,
      capabilities: enabled,
      hasCapability: capability => enabled.has(capability),
      refreshRuntime,
    };
  }, [capabilities, configured, niche.recommendedCapabilities, profile, refreshRuntime]);

  useEffect(
    () => applyBusinessMetadata(document, window.location, profile, theme.tokens.background),
    [profile, theme.tokens.background],
  );

  return (
    <BusinessContext.Provider value={value}>
      <NicheContext.Provider value={niche}>
        <ThemeContext.Provider value={theme}>
          <div data-theme={theme.id} data-theme-mode={theme.mode} style={themeStyle} className="core-theme-root">
            {children}
          </div>
        </ThemeContext.Provider>
      </NicheContext.Provider>
    </BusinessContext.Provider>
  );
}
