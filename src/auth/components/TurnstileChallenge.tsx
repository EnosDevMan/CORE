import { useEffect, useRef, useState } from 'react';

interface TurnstileOptions {
  sitekey: string;
  size: 'flexible';
  callback: (token: string) => void;
  'expired-callback': () => void;
  'error-callback': () => void;
}

interface TurnstileApi {
  render: (container: HTMLElement, options: TurnstileOptions) => string;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let loadingTurnstile: Promise<TurnstileApi> | undefined;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (loadingTurnstile) return loadingTurnstile;

  loadingTurnstile = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-core-turnstile]');
    const script = existing ?? document.createElement('script');

    const fail = () => {
      loadingTurnstile = undefined;
      script.remove();
      reject(new Error('Não foi possível carregar a verificação de segurança.'));
    };

    script.addEventListener('load', () => {
      if (window.turnstile) resolve(window.turnstile);
      else fail();
    }, { once: true });
    script.addEventListener('error', fail, { once: true });

    if (!existing) {
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.dataset.coreTurnstile = 'true';
      document.head.appendChild(script);
    }
  });

  return loadingTurnstile;
}

interface TurnstileChallengeProps {
  siteKey: string;
  onTokenChange: (token: string) => void;
}

/** Supabase Auth validates the returned token server-side when CAPTCHA is enabled. */
export function TurnstileChallenge({ siteKey, onTokenChange }: TurnstileChallengeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    let widgetId: string | undefined;

    void loadTurnstile()
      .then(turnstile => {
        if (!active || !containerRef.current) return;

        widgetId = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          size: 'flexible',
          callback: token => {
            if (!active) return;
            setError('');
            onTokenChange(token);
          },
          'expired-callback': () => {
            if (active) onTokenChange('');
          },
          'error-callback': () => {
            if (!active) return;
            onTokenChange('');
            setError('A verificação de segurança falhou. Tente novamente.');
          },
        });
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar a verificação de segurança.');
      });

    return () => {
      active = false;
      if (widgetId) window.turnstile?.remove(widgetId);
    };
  }, [onTokenChange, siteKey]);

  return (
    <div className="space-y-2">
      <div ref={containerRef} aria-label="Verificação de segurança contra robôs" />
      {error && <p role="alert" className="text-xs font-medium text-rose-600">{error}</p>}
    </div>
  );
}
