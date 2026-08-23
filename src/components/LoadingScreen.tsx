import React from 'react';
import { CalendarDays, TriangleAlert } from 'lucide-react';

interface LoadingScreenProps {
  /** Se definido, mostra um estado de erro com botão de retentativa em vez do spinner de carregamento. */
  error?: string | null;
  onRetry?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ error, onRetry }) => {
  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center text-white relative overflow-hidden select-none">
      {/* Premium ambient radial light glow in the background */}
      <div className={`absolute w-[500px] h-[500px] rounded-full blur-[120px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse-glow ${error ? 'bg-red-500/5' : 'bg-amber-500/5'}`} />
      
      {/* Elegant background lines/texture */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.015)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Main loading element container */}
      <div className="relative z-10 flex flex-col items-center max-w-sm px-6 text-center animate-float">
        
        {/* Animated status mark kept niche-neutral for every installation. */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          {/* Outer dashed slow rotating decoration ring */}
          <div className="absolute -inset-3 border border-slate-800/40 border-dashed rounded-full animate-spin-slow pointer-events-none" />
          
          {/* Inner golden glow ring (para de girar em estado de erro) */}
          <div className={`absolute inset-0 border-[3.5px] rounded-full pointer-events-none ${error ? 'border-red-500/20 border-t-red-500 border-r-red-500/40' : 'border-amber-500/20 border-t-amber-500 border-r-amber-500/40 animate-spin'}`} />
          
          {/* Third subtle secondary spinning helper for luxury motion depth */}
          <div className="absolute inset-2 border border-slate-700/30 rounded-full animate-pulse pointer-events-none" />

          {/* Centered Scissors Emoji with custom 3D shadow and shaking snip motion */}
          <div className="relative z-20 flex items-center justify-center">
            {error
              ? <TriangleAlert aria-label="Aviso" className="h-12 w-12 text-red-400" />
              : <CalendarDays aria-label="Agenda" className="h-12 w-12 animate-pulse text-amber-400" />}
          </div>
        </div>

        {/* Brand Typography & Status Messages */}
        <div className="mt-10 space-y-3">
          <h2 className="text-2xl font-black tracking-tight text-white font-sans bg-gradient-to-r from-white via-slate-100 to-amber-200 bg-clip-text text-transparent">
            Agenda do negócio
          </h2>
          
          <div className={`h-[2px] w-12 mx-auto rounded-full bg-gradient-to-r from-transparent to-transparent ${error ? 'via-red-500' : 'via-amber-500'}`} />
          
          {error ? (
            <>
              <p className="text-xs font-semibold tracking-widest text-red-400/90 uppercase">
                Não foi possível carregar
              </p>
              <p className="text-slate-400 text-xs font-medium max-w-[280px] leading-relaxed">
                {error}
              </p>
              <p className="text-slate-500 text-[11px] max-w-[280px] leading-relaxed">
                Verifique sua conexão. Se o problema continuar, pode ser uma configuração pendente do backend (Supabase).
              </p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-sm hover:bg-slate-100 transition-colors"
                >
                  Tentar novamente
                </button>
              )}
            </>
          ) : (
            <>
              <p className="text-xs font-semibold tracking-widest text-amber-500/90 uppercase animate-pulse">
                Preparando sua agenda
              </p>
              <p className="text-slate-400 text-xs font-medium max-w-[280px] leading-relaxed">
                Sincronizando horários e serviços atualizados...
              </p>
            </>
          )}
        </div>

        {/* Mini progress dot pipeline (só aparece durante o carregamento, não no erro) */}
        {!error && (
          <div className="flex items-center gap-1.5 mt-8">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-[pulse_1s_infinite_100ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-[pulse_1s_infinite_300ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-[pulse_1s_infinite_500ms]" />
          </div>
        )}
      </div>
    </div>
  );
};
