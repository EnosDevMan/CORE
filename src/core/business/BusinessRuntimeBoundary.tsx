import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { LoadingScreen } from '../../components/LoadingScreen';
import { BusinessProvider } from './BusinessProvider';
import { businessService, type BusinessRuntime } from './businessService';
import type { BusinessProfile } from './types';
import { DEFAULT_BUSINESS_TIMEZONE } from '../../utils/validation';
import { CORE_BOOTSTRAP_THEME } from '../../themes/bootstrapTheme';

/**
 * A fresh installation has no published business profile yet, but auth and
 * onboarding still need a valid runtime context. This profile is deliberately
 * niche-neutral and is never written to the database.
 */
const BOOTSTRAP_BUSINESS_PROFILE: BusinessProfile = {
  name: 'CORE',
  timezone: DEFAULT_BUSINESS_TIMEZONE,
  currency: 'BRL',
  locale: 'pt-BR',
  nicheId: 'core_bootstrap',
  themeId: 'minimal_light',
  themeStyleId: 'minimal',
  paletteId: 'minimal_white',
};

export function BusinessRuntimeBoundary({ children }: { children: ReactNode }) {
  const [runtime, setRuntime] = useState<BusinessRuntime | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const refreshRuntime = useCallback(async () => {
    try {
      const result = await businessService.getRuntime();
      setRuntime(result);
      setError(null);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Não foi possível carregar o perfil do negócio.';
      setError(message);
      throw cause;
    }
  }, []);

  useEffect(() => {
    let active = true;
    businessService.getRuntime()
      .then(result => { if (active) setRuntime(result); })
      .catch(cause => {
        if (active) setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o perfil do negócio.');
      });
    return () => { active = false; };
  }, []);

  if (error) return <LoadingScreen error={error} onRetry={() => window.location.reload()} />;
  if (runtime === undefined) return <LoadingScreen />;
  if (runtime === null) {
    return (
      <BusinessProvider profile={BOOTSTRAP_BUSINESS_PROFILE} theme={CORE_BOOTSTRAP_THEME} capabilities={[]} configured={false} refreshRuntime={refreshRuntime}>
        {children}
      </BusinessProvider>
    );
  }

  return (
    <BusinessProvider profile={runtime.profile} theme={runtime.theme} capabilities={runtime.capabilities} configured refreshRuntime={refreshRuntime}>
      {children}
    </BusinessProvider>
  );
}
