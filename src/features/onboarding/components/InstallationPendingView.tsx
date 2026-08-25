import { ArrowRight, LockKeyhole, Settings2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface InstallationPendingViewProps {
  onOpenAccess: () => void;
  onOpenPrivacy: () => void;
}

/**
 * Public shell shown while a fresh CORE installation is not configured yet.
 * No business-specific content is rendered before the owner finishes onboarding.
 */
export function InstallationPendingView({ onOpenAccess, onOpenPrivacy }: InstallationPendingViewProps) {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:py-16">
      <section
        aria-labelledby="installation-pending-title"
        className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-2xl items-center justify-center sm:min-h-[calc(100vh-8rem)]"
      >
        <div className="w-full rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-black/20 sm:p-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-sm font-black text-slate-950">
                C
              </div>
              <div>
                <p className="font-black tracking-tight text-white">CORE</p>
                <p className="text-xs text-slate-400">Plataforma de gestão e agendamentos</p>
              </div>
            </div>
            <span className="hidden rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-300 sm:inline-flex">
              Configuração inicial
            </span>
          </div>

          <div className="mt-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-amber-300">
            <Settings2 size={26} aria-hidden="true" />
          </div>

          <h1 id="installation-pending-title" className="mt-6 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Este ambiente ainda está sendo configurado
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
            A página pública e a agenda permanecem indisponíveis até que o responsável conclua a configuração do negócio.
            Assim, nenhuma identidade, serviço ou profissional de exemplo é publicado por engano.
          </p>

          <div className="mt-8 rounded-2xl border border-white/10 bg-slate-950/60 p-4 sm:p-5">
            <div className="flex gap-3">
              <LockKeyhole className="mt-0.5 shrink-0 text-slate-400" size={20} aria-hidden="true" />
              <div>
                <p className="text-sm font-bold text-slate-100">Acesso do responsável</p>
                <p className="mt-1 text-sm leading-5 text-slate-400">
                  Entre com a conta responsável ou crie a primeira conta para continuar a instalação.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button onClick={onOpenAccess} className="min-h-11 justify-center sm:px-6">
              Entrar ou criar conta <ArrowRight size={17} aria-hidden="true" />
            </Button>
            <button
              type="button"
              onClick={onOpenPrivacy}
              className="min-h-11 rounded-xl px-4 text-sm font-semibold text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              Política de Privacidade
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
