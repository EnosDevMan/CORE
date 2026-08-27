import { useEffect, useMemo, type CSSProperties, type ReactNode } from 'react';
import { getNichePreset } from '../../niches/registry';
import { CORE_BOOTSTRAP_THEME } from '../../themes/bootstrapTheme';
import { toCssVariables } from '../../themes/cssVariables';
import type { ResolvedTheme } from '../../themes/types';
import type { BusinessContextValue, BusinessProfile, Capability } from './types';
import { BusinessContext, NicheContext, ThemeContext } from './contexts';
import { applyBusinessMetadata } from './metadata';

interface BusinessProviderProps {
  profile: BusinessProfile;
  capabilities?: readonly Capability[];
  configured?: boolean;
  refreshRuntime?: () => Promise<void>;
  theme?: ResolvedTheme;
  children: ReactNode;
}

const noopRefresh = async () => undefined;

export function BusinessProvider({
  profile,
  capabilities,
  configured = true,
  refreshRuntime = noopRefresh,
  theme = CORE_BOOTSTRAP_THEME,
  children,
}: BusinessProviderProps) {
  const niche = getNichePreset(profile.nicheId);
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
          <div
            data-theme={profile.themeId}
            data-theme-style={theme.styleId}
            data-palette={theme.paletteId}
            data-theme-mode={theme.mode}
            data-surface-mode={theme.mode}
            data-niche={niche.id}
            style={themeStyle}
            className="core-theme-root"
          >
            {children}
          </div>
        </ThemeContext.Provider>
      </NicheContext.Provider>
    </BusinessContext.Provider>
  );
}
