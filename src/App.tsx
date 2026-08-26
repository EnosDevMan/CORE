/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Suspense, lazy, useEffect, useState, useTransition } from 'react';
import { useApp } from './store/useApp';
import { AppDataLoader } from './store/AppDataLoader';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';

const loadBookingFlow = () => import('./components/BookingFlow');
const loadCustomerDashboard = () => import('./components/CustomerDashboard');
const loadProfessionalDashboard = () => import('./components/ProfessionalDashboard');
const loadAdminDashboard = () => import('./components/AdminDashboard');
const loadPrivacyPolicyPage = () => import('./components/PrivacyPolicyPage');

const BookingFlow = lazy(() => loadBookingFlow().then(module => ({ default: module.BookingFlow })));
const CustomerDashboard = lazy(() => loadCustomerDashboard().then(module => ({ default: module.CustomerDashboard })));
const ProfessionalDashboard = lazy(() => loadProfessionalDashboard().then(module => ({ default: module.ProfessionalDashboard })));
const AdminDashboard = lazy(() => loadAdminDashboard().then(module => ({ default: module.AdminDashboard })));
const PrivacyPolicyPage = lazy(() => loadPrivacyPolicyPage().then(module => ({ default: module.PrivacyPolicyPage })));
import { LoginModal } from './components/LoginModal';
import { ResetPasswordView } from './components/ResetPasswordView';
import { Shield } from 'lucide-react';
import { LoadingScreen } from './components/LoadingScreen';
import { OnboardingWizard } from './features/onboarding/components/OnboardingWizard';
import { InstallationPendingView } from './features/onboarding/components/InstallationPendingView';
import { onboardingService, type OnboardingState } from './features/onboarding/services/onboardingService';
import { BusinessRuntimeBoundary } from './core/business/BusinessRuntimeBoundary';
import { useBusiness } from './core/business/hooks';
import { canAccessProfessionalWorkspace, isAdministratorRole } from './auth/authorization';

type CoreView = 'landing' | 'booking' | 'customer' | 'professional' | 'admin' | 'privacy';
type IdleCapableWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

const warmView = (view: CoreView): void => {
  if (view === 'booking') void loadBookingFlow();
  else if (view === 'customer') void loadCustomerDashboard();
  else if (view === 'professional') void loadProfessionalDashboard();
  else if (view === 'admin') void loadAdminDashboard();
  else if (view === 'privacy') void loadPrivacyPolicyPage();
};

const scheduleWhenIdle = (callback: () => void): (() => void) => {
  const idleWindow = window as IdleCapableWindow;
  if (idleWindow.requestIdleCallback) {
    const handle = idleWindow.requestIdleCallback(callback, { timeout: 1500 });
    return () => idleWindow.cancelIdleCallback?.(handle);
  }

  const handle = window.setTimeout(callback, 900);
  return () => window.clearTimeout(handle);
};

function CoreSchedulingApp() {
  const [currentView, setCurrentView] = useState<CoreView>(() =>
    window.location.hash === '#privacy' ? 'privacy' : 'landing',
  );
  const [loginOpen, setLoginOpen] = useState(false);
  const [bookingSelection, setBookingSelection] = useState<{ serviceId?: string; professionalId?: string }>({});
  const [onboardingState, setOnboardingState] = useState<OnboardingState | null>(null);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const [isRoutePending, startRouteTransition] = useTransition();
  const { configured: businessConfigured } = useBusiness();
  const {
    loading,
    loadError,
    authInitializationError,
    currentUser,
    passwordRecoveryMode,
    completePasswordRecovery,
    logout,
  } = useApp();

  useEffect(() => {
    const protectedView = currentView === 'customer' || currentView === 'professional' || currentView === 'admin';
    if (!loading && !currentUser && protectedView) {
      setCurrentView('landing');
    }
  }, [currentUser, currentView, loading]);

  // A agenda é o destino de maior conversão. Depois que a home já apareceu,
  // o browser baixa esse pequeno chunk em tempo ocioso; assim o clique em
  // "Agendar" normalmente não precisa esperar uma segunda ida à rede.
  // Áreas autenticadas só são aquecidas quando existe uma sessão compatível.
  useEffect(() => {
    if (loading || currentView !== 'landing' || !businessConfigured) return undefined;
    return scheduleWhenIdle(() => {
      warmView('booking');
      if (currentUser) warmView('customer');
      if (isAdministratorRole(currentUser?.role)) warmView('admin');
      else if (canAccessProfessionalWorkspace(currentUser?.role)) warmView('professional');
    });
  }, [businessConfigured, currentUser, currentView, loading]);

  // The protected onboarding RPC is only needed for an authenticated user
  // while this installation is still unpublished. Public visitors rely on the
  // business runtime's `configured` flag and never receive internal owner state.
  useEffect(() => {
    if (loading || businessConfigured || !currentUser) {
      setOnboardingState(null);
      setOnboardingError(null);
      return;
    }

    let active = true;
    onboardingService.getState()
      .then(state => { if (active) setOnboardingState(state); })
      .catch(error => {
        if (active) setOnboardingError(error instanceof Error ? error.message : 'Não foi possível verificar a configuração inicial.');
      });
    return () => { active = false; };
  }, [businessConfigured, currentUser, loading]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (authInitializationError) {
    return <LoadingScreen error={authInitializationError} onRetry={() => window.location.reload()} />;
  }

  if (loadError) {
    return <LoadingScreen error={loadError} onRetry={() => window.location.reload()} />;
  }

  if (passwordRecoveryMode) {
    return <ResetPasswordView onComplete={completePasswordRecovery} />;
  }

  if (!businessConfigured) {
    // Legal content must remain reachable before installation because account
    // creation can require the user to review the privacy policy.
    if (currentView === 'privacy') {
      return (
        <Suspense fallback={<LoadingScreen />}>
          <PrivacyPolicyPage onBack={() => setCurrentView('landing')} />
        </Suspense>
      );
    }

    if (!currentUser) {
      return (
        <>
          <InstallationPendingView
            onOpenAccess={() => setLoginOpen(true)}
            onOpenPrivacy={() => {
              warmView('privacy');
              setCurrentView('privacy');
            }}
          />
          <LoginModal
            isOpen={loginOpen}
            onClose={() => setLoginOpen(false)}
            onOpenPrivacy={() => {
              setLoginOpen(false);
              warmView('privacy');
              setCurrentView('privacy');
            }}
          />
        </>
      );
    }

    if (onboardingError) {
      return <LoadingScreen error={onboardingError} onRetry={() => window.location.reload()} />;
    }

    if (onboardingState === null) {
      return <LoadingScreen />;
    }

    if (!onboardingState.completed && (isAdministratorRole(currentUser.role) || !onboardingState.ownerExists)) {
      return <OnboardingWizard currentRole={currentUser.role} />;
    }

    if (onboardingState.completed) {
      return (
        <LoadingScreen
          error="A configuração inicial foi concluída, mas o perfil público ainda não foi carregado."
          onRetry={() => window.location.reload()}
        />
      );
    }

    return (
      <LoadingScreen
        error="A configuração inicial ainda precisa ser concluída pelo proprietário."
        onRetry={() => window.location.reload()}
      />
    );
  }

  // O AdminDashboard tem seu próprio header/sidebar completo (marca, botão
  // "voltar" e logout), então quando ele está de fato visível a Navbar global
  // fica oculta para não duplicar essa navegação (e não sobrepor no mobile).
  const isAdminShell = currentView === 'admin' && isAdministratorRole(currentUser?.role);

  const navigateTo = (view: CoreView, selection?: { serviceId?: string; professionalId?: string }) => {
    // Validação de RBAC
    if (view === 'admin' && !isAdministratorRole(currentUser?.role)) return;
    if (view === 'professional' && !canAccessProfessionalWorkspace(currentUser?.role)) return;

    // 'booking' propositalmente NÃO exige login: o fluxo suporta convidado.
    // Só o painel do cliente, com histórico pessoal, exige sessão.
    if (view === 'customer' && !currentUser) {
      setLoginOpen(true);
      return;
    }

    // Inicia o download antes de pedir a troca de tela. React mantém a tela
    // atual visível caso o chunk ainda esteja chegando, em vez de impor um
    // overlay e um atraso fixo. O indicador superior só aparece se houver
    // espera real.
    warmView(view);
    startRouteTransition(() => {
      if (view === 'booking') setBookingSelection(selection || {});
      setCurrentView(view);
    });
  };

  const renderView = () => {
    switch (currentView) {
      case 'landing':
        return (
          <LandingPage
            onStartBooking={(selection) => navigateTo('booking', selection)}
            onOpenLogin={() => setLoginOpen(true)}
            onOpenPrivacy={() => navigateTo('privacy')}
          />
        );
      case 'booking':
        return (
          <BookingFlow
            initialServiceId={bookingSelection.serviceId}
            initialProfessionalId={bookingSelection.professionalId}
            onNavigateToView={(view) => navigateTo(view === 'home' ? 'landing' : view)}
          />
        );
      case 'customer':
        return <CustomerDashboard />;
      case 'privacy':
        return <PrivacyPolicyPage onBack={() => navigateTo('landing')} />;
      case 'professional':
        if (!currentUser || !canAccessProfessionalWorkspace(currentUser.role)) {
          return (
            <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl border border-slate-100 shadow-xl text-center flex flex-col items-center">
              <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                <Shield size={28} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Acesso Restrito</h2>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                Esta área é reservada exclusivamente para os profissionais da equipe.
              </p>
              <button
                onClick={() => setLoginOpen(true)}
                className="mt-6 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Fazer Login Profissional
              </button>
            </div>
          );
        }
        return <ProfessionalDashboard />;
      case 'admin':
        if (!currentUser || !isAdministratorRole(currentUser.role)) {
          return (
            <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl border border-slate-100 shadow-xl text-center flex flex-col items-center">
              <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                <Shield size={28} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Painel Gerencial Restrito</h2>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                Esta área é reservada para a administração do negócio. Por favor, autentique-se para continuar.
              </p>
              <button
                onClick={() => setLoginOpen(true)}
                className="mt-6 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Fazer Login de Administrador
              </button>
            </div>
          );
        }
        return (
          <AdminDashboard
            onLogout={async () => {
              await logout();
              startRouteTransition(() => setCurrentView('landing'));
            }}
            onNavigateHome={() => navigateTo('landing')}
          />
        );
      default:
        return (
          <LandingPage
            onStartBooking={(selection) => navigateTo('booking', selection)}
            onOpenLogin={() => setLoginOpen(true)}
            onOpenPrivacy={() => navigateTo('privacy')}
          />
        );
    }
  };

  return (
    <div
      className="min-h-screen bg-[var(--core-background,#f8fafc)] flex flex-col font-sans antialiased text-[var(--core-foreground,#1e293b)]"
      aria-busy={isRoutePending || undefined}
    >
      {isRoutePending && (
        <div className="core-route-progress" role="progressbar" aria-label="Carregando próxima tela">
          <span />
        </div>
      )}

      {!isAdminShell && (
        <Navbar
          onOpenLogin={() => setLoginOpen(true)}
          onNavigate={(view) => navigateTo(view)}
          currentPage={currentView}
        />
      )}

      <main
        key={currentView}
        className={`flex-1 core-view-enter ${currentView === 'landing' ? '' : 'core-themed-workspace'}`}
      >
        <Suspense fallback={<LoadingScreen />}>
          {renderView()}
        </Suspense>
      </main>

      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onOpenPrivacy={() => { setLoginOpen(false); navigateTo('privacy'); }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppDataLoader>
      <BusinessRuntimeBoundary>
        <CoreSchedulingApp />
      </BusinessRuntimeBoundary>
    </AppDataLoader>
  );
}
