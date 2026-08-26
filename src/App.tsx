/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { useApp } from './store/useApp';
import { AppDataLoader } from './store/AppDataLoader';
import { Navbar } from './components/Navbar';
import { Suspense, lazy } from 'react';

const LandingPage = lazy(() => import('./components/LandingPage').then(module => ({ default: module.LandingPage })));
const BookingFlow = lazy(() => import('./components/BookingFlow').then(module => ({ default: module.BookingFlow })));
const CustomerDashboard = lazy(() => import('./components/CustomerDashboard').then(module => ({ default: module.CustomerDashboard })));
const ProfessionalDashboard = lazy(() => import('./components/ProfessionalDashboard').then(module => ({ default: module.ProfessionalDashboard })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const PrivacyPolicyPage = lazy(() => import('./components/PrivacyPolicyPage').then(module => ({ default: module.PrivacyPolicyPage })));
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
import { BusinessBrand } from './core/business/BusinessBrand';

function CoreSchedulingApp() {
  const [currentView, setCurrentView] = useState<'landing' | 'booking' | 'customer' | 'professional' | 'admin' | 'privacy'>(() =>
    window.location.hash === '#privacy' ? 'privacy' : 'landing',
  );
  const [loginOpen, setLoginOpen] = useState(false);
  const [bookingSelection, setBookingSelection] = useState<{ serviceId?: string; professionalId?: string }>({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionMessage, setTransitionMessage] = useState('');
  const [onboardingState, setOnboardingState] = useState<OnboardingState | null>(null);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  useEffect(() => () => {
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
  }, []);

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
            onOpenPrivacy={() => setCurrentView('privacy')}
          />
          <LoginModal
            isOpen={loginOpen}
            onClose={() => setLoginOpen(false)}
            onOpenPrivacy={() => { setLoginOpen(false); setCurrentView('privacy'); }}
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

  const navigateTo = (view: typeof currentView, selection?: { serviceId?: string; professionalId?: string }) => {
    // Validação de RBAC
    if (view === 'admin' && !isAdministratorRole(currentUser?.role)) {
      return;
    }
    if (view === 'professional' && !canAccessProfessionalWorkspace(currentUser?.role)) {
      return;
    }
    // 'booking' propositalmente NÃO exige login: o fluxo de agendamento
    // suporta convidado (nome/telefone/e-mail avulsos), tanto no backend
    // (RPC create_booking aceita customer_id nulo) quanto na UI
    // (ReviewStep mostra um formulário de convidado quando não há sessão).
    // Só o painel do cliente ('customer', com histórico pessoal) exige login.
    if (view === 'customer' && !currentUser) {
      setLoginOpen(true);
      return;
    }

    // Uma navegação nova sempre invalida a transição anterior. Sem isso,
    // cliques rápidos podiam executar timers fora de ordem e abrir uma tela
    // diferente da última escolhida pelo usuário.
    if (transitionTimer.current) clearTimeout(transitionTimer.current);

    if (view === 'booking') {
      setBookingSelection(selection || {});
      setIsTransitioning(true);
      setTransitionMessage('Preparando a agenda...');
      transitionTimer.current = setTimeout(() => {
        setCurrentView(view);
        setIsTransitioning(false);
        transitionTimer.current = null;
      }, 750);
    } else if (view === 'customer' && currentView === 'booking') {
      setIsTransitioning(true);
      setTransitionMessage('Carregando seus agendamentos...');
      transitionTimer.current = setTimeout(() => {
        setCurrentView(view);
        setIsTransitioning(false);
        transitionTimer.current = null;
      }, 700);
    } else {
      setIsTransitioning(true);
      setTransitionMessage('Carregando...');
      transitionTimer.current = setTimeout(() => {
        setCurrentView(view);
        setIsTransitioning(false);
        transitionTimer.current = null;
      }, 450);
    }
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
        // Proprietários também podem usar o modo de simulação para
        // visualizar o painel de um profissional (ver
        // useProfessionalDashboard e withRoleGuard em ProfessionalDashboard.tsx). Antes,
        // A autorização central mantém compatibilidade com as roles legadas enquanto
        // navigateTo já deixava passar — caía nesta tela de "Acesso
        // Restrito" em vez do painel.
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
              setCurrentView('landing');
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
    <div className="min-h-screen bg-[var(--core-background,#f8fafc)] flex flex-col font-sans antialiased text-[var(--core-foreground,#1e293b)]">
      {!isAdminShell && (
        <Navbar
          onOpenLogin={() => setLoginOpen(true)}
          onNavigate={(view) => navigateTo(view)}
          currentPage={currentView}
        />
      )}

      <main
        key={currentView}
        className={`flex-1 animate-in fade-in slide-in-from-bottom-2.5 duration-300 ${currentView === 'landing' ? '' : 'core-themed-workspace'}`}
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

      {isTransitioning && (
        <div className="core-transition-overlay fixed inset-0 z-50 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-200">
          <div className="flex flex-col items-center text-center max-w-sm px-6" role="status">
            <BusinessBrand showName={false} size="lg" />
            <p className="mt-5 text-sm font-bold">{transitionMessage}</p>
          </div>
        </div>
      )}
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
