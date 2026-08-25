import { useEffect, useState, type ReactNode } from 'react';
import { LoadingScreen } from '../../components/LoadingScreen';
import { BusinessProvider } from './BusinessProvider';
import { businessService, type BusinessRuntime } from './businessService';
import type { BusinessProfile } from './types';
import { DEFAULT_BUSINESS_TIMEZONE } from '../../utils/validation';

/**
 * A fresh installation has no business_profile until the owner completes the
 * wizard. The shell still needs a valid context so the login/registration UI
 * can render and the owner can reach that wizard.
 */
export const BOOTSTRAP_BUSINESS_PROFILE: BusinessProfile = {
  name: 'CORE',
  timezone: DEFAULT_BUSINESS_TIMEZONE,
  currency: 'BRL',
  locale: 'pt-BR',
  nicheId: 'barbershop',
  themeId: 'minimal_light',
};

export function BusinessRuntimeBoundary({ children }: { children: ReactNode }) {
  const [runtime, setRuntime] = useState<BusinessRuntime | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

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
    return <BusinessProvider profile={BOOTSTRAP_BUSINESS_PROFILE} capabilities={[]}>{children}</BusinessProvider>;
  }
  return <BusinessProvider profile={runtime.profile} capabilities={runtime.capabilities}>{children}</BusinessProvider>;
}
