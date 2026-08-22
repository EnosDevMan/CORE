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
const BarberDashboard = lazy(() => import('./components/BarberDashboard').then(module => ({ default: module.BarberDashboard })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const PrivacyPolicyPage = lazy(() => import('./components/PrivacyPolicyPage').then(module => ({ default: module.PrivacyPolicyPage })));
import { LoginModal } from './components/LoginModal';
import { ResetPasswordView } from './components/ResetPasswordView';
import { Shield, Scissors } from 'lucide-react';
import { LoadingScreen } from './components/LoadingScreen';

function BarbeariaApp() {
  const [currentView, setCurrentView] = useState<'landing' | 'booking' | 'customer' | 'barber' | 'admin' | 'privacy'>('landing');
  const [loginOpen, setLoginOpen] = useState(false);
  const [bookingSelection, setBookingSelection] = useState<{ serviceId?: string; barberId?: string }>({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionMessage, setTransitionMessage] = useState('');
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { loading, loadError, currentUser, passwordRecoveryMode, completePasswordRecovery, logout } = useApp();

  useEffect(() => {
    const protectedView = currentView === 'customer' || currentView === 'barber' || currentView === 'admin';
    if (!loading && !currentUser && protectedView) {
      setCurrentView('landing');
    }
  }, [currentUser, currentView, loading]);

  useEffect(() => () => {
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  if (loadError) {
    return <LoadingScreen error={loadError} onRetry={() => window.location.reload()} />;
  }

  if (passwordRecoveryMode) {
    return <ResetPasswordView onComplete={completePasswordRecovery} />;
  }

  // O AdminDashboard tem seu próprio header/sidebar completo (marca, botão
  // "voltar" e logout), então quando ele está de fato visível a Navbar global
  // fica oculta para não duplicar essa navegação (e não sobrepor no mobile).
  const isAdminShell = currentView === 'admin' && currentUser?.role === 'admin';

  const navigateTo = (view: typeof currentView, selection?: { serviceId?: string; barberId?: string }) => {
    // Validação de RBAC
    if (view === 'admin' && currentUser?.role !== 'admin') {
      return;
    }
    if (view === 'barber' && !['admin', 'barber'].includes(currentUser?.role || '')) {
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
            initialBarberId={bookingSelection.barberId}
            onNavigateToView={(view) => navigateTo(view === 'home' ? 'landing' : view)}
          />
        );
      case 'customer':
        return <CustomerDashboard />;
      case 'privacy':
        return <PrivacyPolicyPage onBack={() => navigateTo('landing')} />;
      case 'barber':
        // Aceita 'admin' também: é o modo de simulação, em que um admin
        // visualiza o painel "como se fosse" um barbeiro (ver
        // useBarberDashboard e withRoleGuard em BarberDashboard.tsx). Antes,
        // esta checagem só liberava role === 'barber', então o admin — que
        // navigateTo já deixava passar — caía nesta tela de "Acesso
        // Restrito" em vez do painel.
        if (!currentUser || !['admin', 'barber'].includes(currentUser.role)) {
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
        return <BarberDashboard />;
      case 'admin':
        if (!currentUser || currentUser.role !== 'admin') {
          return (
            <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl border border-slate-100 shadow-xl text-center flex flex-col items-center">
              <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                <Shield size={28} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Painel Gerencial Restrito</h2>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                Esta área é reservada para a administração da barbearia. Por favor, autentique-se para continuar.
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800">
      {!isAdminShell && (
        <Navbar
          onOpenLogin={() => setLoginOpen(true)}
          onNavigate={(view) => navigateTo(view)}
          currentPage={currentView}
        />
      )}

      <main key={currentView} className="flex-1 animate-in fade-in slide-in-from-bottom-2.5 duration-300">
        <Suspense fallback={<LoadingScreen />}>
          {renderView()}
        </Suspense>
      </main>

      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onOpenPrivacy={() => { setLoginOpen(false); navigateTo('privacy'); }}
      />

      {/* Transitional Scissors Loader */}
      {isTransitioning && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center text-white animate-in fade-in duration-200">
          <div className="flex flex-col items-center text-center max-w-sm px-6" role="status">
            <Scissors size={36} className="text-amber-500" aria-hidden="true" />
            <p className="text-sm font-bold text-white mt-5">{transitionMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppDataLoader>
      <BarbeariaApp />
    </AppDataLoader>
  );
}
