import { useEffect, useState, type ReactNode } from 'react';
import { LoadingScreen } from '../../components/LoadingScreen';
import { BusinessProvider } from './BusinessProvider';
import { businessService, type BusinessRuntime } from './businessService';

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
  if (runtime === null) return <>{children}</>;
  return <BusinessProvider profile={runtime.profile} capabilities={runtime.capabilities}>{children}</BusinessProvider>;
}
