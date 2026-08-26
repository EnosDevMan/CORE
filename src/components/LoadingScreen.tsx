import React from 'react';
import { CalendarDays, TriangleAlert } from 'lucide-react';

interface LoadingScreenProps {
  /** Se definido, mostra um estado de erro com botão de retentativa em vez do spinner de carregamento. */
  error?: string | null;
  onRetry?: () => void;
}

/**
 * Estado inicial deliberadamente leve: uma única animação baseada em transform
 * substitui blur de tela inteira, múltiplos spins e pulsos concorrentes. Assim
 * até aparelhos modestos continuam responsivos justamente enquanto aguardam a
 * rede e a primeira consulta ao Supabase.
 */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({ error, onRetry }) => {
  return (
    <div
      className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center text-white relative overflow-hidden select-none px-6"
      role={error ? 'alert' : 'status'}
      aria-live="polite"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(148,163,184,0.08),transparent_58%)] pointer-events-none" />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center text-center">
        <div className="relative flex h-20 w-20 items-center justify-center">
          {!error && (
            <div className="absolute inset-0 rounded-full border-2 border-slate-700/60 border-t-slate-300 animate-spin" aria-hidden="true" />
          )}
          <div className={`flex h-14 w-14 items-center justify-center rounded-full border ${error ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-slate-700 bg-slate-900 text-slate-200'}`}>
            {error
              ? <TriangleAlert aria-label="Aviso" className="h-7 w-7" />
              : <CalendarDays aria-label="Agenda" className="h-7 w-7" />}
          </div>
        </div>

        <div className="mt-7 space-y-2.5">
          <h2 className="text-xl font-black tracking-tight text-white">Agenda do negócio</h2>

          {error ? (
            <>
              <p className="text-xs font-semibold tracking-widest text-red-400/90 uppercase">
                Não foi possível carregar
              </p>
              <p className="text-slate-300 text-xs font-medium max-w-[300px] leading-relaxed">
                {error}
              </p>
              <p className="text-slate-500 text-[11px] max-w-[300px] leading-relaxed">
                Verifique sua conexão. Se o problema continuar, pode ser uma configuração pendente do backend (Supabase).
              </p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="mt-3 px-5 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-sm hover:bg-slate-100 transition-colors"
                >
                  Tentar novamente
                </button>
              )}
            </>
          ) : (
            <>
              <p className="text-xs font-semibold tracking-widest text-slate-300 uppercase">
                Preparando sua agenda
              </p>
              <p className="text-slate-500 text-xs font-medium max-w-[280px] leading-relaxed">
                Carregando as informações atualizadas do negócio...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
