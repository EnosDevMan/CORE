import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { getSupabaseConfigError } from './utils/environment.ts';
import './index.css';

const root = createRoot(document.getElementById('root')!);

const renderStartupError = (message: string) => {
  root.render(
    <StrictMode>
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6 text-white">
        <div className="w-full max-w-md rounded-2xl border border-amber-500/20 bg-slate-900 p-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-2xl" aria-hidden="true">
            ⚠️
          </div>
          <h1 className="text-xl font-black">Aplicação não configurada</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">{message}</p>
          <p className="mt-5 text-xs leading-relaxed text-slate-500">
            Na Vercel, habilite as variáveis também para o ambiente Preview e publique o branch
            novamente.
          </p>
        </div>
      </div>
    </StrictMode>,
  );
};

const supabaseConfigError = getSupabaseConfigError({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
});

if (supabaseConfigError) {
  // App importa o cliente Supabase. Carregá-lo sem as variáveis lançaria um
  // erro antes mesmo de o ErrorBoundary ser montado, resultando em uma tela
  // totalmente vazia nos previews de branches sem ambiente configurado.
  renderStartupError(supabaseConfigError);
} else {
  import('./App.tsx')
    .then(({ default: App }) => {
      root.render(
        <StrictMode>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </StrictMode>,
      );
    })
    .catch((error: unknown) => {
      console.error('Falha ao iniciar a aplicação:', error);
      renderStartupError('Não foi possível carregar a aplicação. Tente publicar o branch novamente.');
    });
}
