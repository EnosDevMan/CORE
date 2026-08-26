
import React from 'react';
import { CheckCircle, AlertCircle, Menu, X, ArrowLeft, LogOut, CalendarPlus, ChevronRight } from 'lucide-react';
import { withRoleGuard } from '../auth/middleware/withRoleGuard';
import { getCompactDisplayName } from '../utils/displayName';
import { useAdminDashboard } from '../features/admin/hooks/useAdminDashboard';
import { AdminOverviewTab } from '../features/admin/components/AdminOverviewTab';
import { AdminReportsTab } from '../features/admin/components/AdminReportsTab';
import { AdminServicesTab } from '../features/admin/components/AdminServicesTab';
import { AdminProfessionalsTab } from '../features/admin/components/AdminProfessionalsTab';
import { AdminGalleryTab } from '../features/admin/components/AdminGalleryTab';
import { AdminClientsTab } from '../features/admin/components/AdminClientsTab';
import { AdminAccountsTab } from '../features/admin/components/AdminAccountsTab';
import { AdminAgendaTab } from '../features/admin/components/AdminAgendaTab';
import { AdminAppearanceTab } from '../features/admin/components/AdminAppearanceTab';
import { AdminSettingsTab } from '../features/admin/components/AdminSettingsTab';
import { AdminBookingForm } from '../features/admin/components/agenda/AdminBookingForm';
import { AdminPetsTab } from '../features/pets/components/AdminPetsTab';
import { BusinessBrand } from '../core/business/BusinessBrand';

interface AdminDashboardProps {
  onLogout: () => void;
  onNavigateHome: () => void;
}

/**
 * Backoffice visual contract: the business theme belongs to the public site.
 * Administration stays predictable and neutral across every niche so an owner
 * never has to relearn contrast, typography or interaction states when the
 * public identity changes.
 */
const ADMIN_NEUTRAL_THEME = {
  '--core-background': '#f8fafc',
  '--core-canvas': '#f8fafc',
  '--core-surface': '#ffffff',
  '--core-surface-elevated': '#ffffff',
  '--core-surface-gradient': 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
  '--core-input': '#ffffff',
  '--core-foreground': '#0f172a',
  '--core-muted': '#f1f5f9',
  '--core-muted-foreground': '#64748b',
  '--core-border': '#e2e8f0',
  '--core-primary': '#0f172a',
  '--core-primary-foreground': '#ffffff',
  '--core-secondary': '#e2e8f0',
  '--core-secondary-foreground': '#0f172a',
  '--core-accent': '#38bdf8',
  '--core-accent-foreground': '#082f49',
  '--core-decorative': '#e2e8f0',
  '--core-decorative-foreground': '#0f172a',
  '--core-nav': '#0f172a',
  '--core-nav-foreground': '#f8fafc',
  '--core-ring': '#334155',
  '--core-card-radius': '1rem',
  '--core-button-radius': '.75rem',
  '--core-font-body': 'Inter, ui-sans-serif, system-ui, sans-serif',
  '--core-font-display': 'Inter, ui-sans-serif, system-ui, sans-serif',
  '--core-heading-tracking': '-0.02em',
  '--core-pattern': 'none',
  '--core-shadow': '0 10px 28px rgba(15, 23, 42, 0.08)',
  '--core-shadow-strong': '0 18px 45px rgba(15, 23, 42, 0.12)',
} as React.CSSProperties;

const AdminDashboardInner: React.FC<AdminDashboardProps> = ({ onLogout, onNavigateHome }) => {
  const {
    currentUser,
    activeTab,
    setActiveTab,
    successMessage,
    setSuccessMessage,
    errorMessage,
    setErrorMessage,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    showFeedback,
    handleUpdateBookingStatus,
    getProfessionalName,
    getServiceName,
    formatBRL,
    navItems
  } = useAdminDashboard();

  const compactUserName = currentUser ? getCompactDisplayName(currentUser.name) : '';
  const activeNavItem = navItems.find(item => item.id === activeTab) ?? navItems[0];
  const hasTab = (id: typeof activeTab) => navItems.some(item => item.id === id);
  const navGroups = ['Operação', 'Gestão', 'Cadastros', 'Sistema'] as const;

  const renderNavigation = (onNavigate?: () => void) => navGroups.map(group => (
    <div key={group} className="mb-5 last:mb-0">
      <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{group}</p>
      <div className="space-y-1">
        {navItems.filter(item => item.group === group).map(item => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); onNavigate?.(); }}
            aria-current={activeTab === item.id ? 'page' : undefined}
            className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              activeTab === item.id
                ? 'bg-white/10 text-white font-semibold'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
            }`}
          >
            <item.icon size={18} className={`core-admin-nav-icon ${activeTab === item.id ? 'is-active' : ''}`} />
            <span>{item.label}</span>
            {activeTab === item.id && <ChevronRight size={14} className="core-admin-nav-icon is-active ml-auto" />}
          </button>
        ))}
      </div>
    </div>
  ));

  return (
    <div className="core-admin-shell flex h-screen" style={ADMIN_NEUTRAL_THEME}>
      <nav className="core-admin-sidebar hidden md:flex md:w-64 flex-col border-r border-white/10">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <button 
              onClick={onNavigateHome} 
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
              title="Voltar ao site"
              aria-label="Voltar ao site"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <BusinessBrand size="sm" nameClassName="max-w-32 text-white" />
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-white/50">Administração</p>
            </div>
          </div>
        </div>

        <div className="flex-1 px-3 py-5 overflow-y-auto custom-scrollbar">{renderNavigation()}</div>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="core-admin-avatar w-9 h-9 rounded-full flex items-center justify-center font-extrabold flex-shrink-0">
              {currentUser?.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm truncate">{compactUserName}</p>
              <p className="text-[11px] text-slate-500 truncate">Administrador</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="mt-2 w-full py-2 px-3 rounded-lg font-semibold text-xs text-slate-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            Sair da Conta
          </button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="core-admin-sidebar md:hidden px-4 py-3 flex items-center justify-between sticky top-0 z-40 border-b border-white/10">
          <div className="flex items-center gap-3">
            <button 
              onClick={onNavigateHome} 
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="font-bold text-sm">{activeNavItem.label}</div>
              <p className="text-[11px] text-slate-400">Painel administrativo</p>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <div className="flex-shrink-0">
          {successMessage && (
            <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-b-2 border-emerald-300 px-6 py-4 flex items-center gap-4 shadow-sm">
              <CheckCircle className="text-emerald-600 flex-shrink-0" size={24} />
              <p className="text-emerald-900 font-semibold text-sm flex-1">{successMessage}</p>
              <button 
                onClick={() => setSuccessMessage('')} 
                className="text-emerald-600 hover:text-emerald-800 font-bold text-xl"
              >
                ×
              </button>
            </div>
          )}
          
          {errorMessage && (
            <div className="bg-gradient-to-r from-rose-50 to-rose-100 border-b-2 border-rose-300 px-6 py-4 flex items-center gap-4 shadow-sm">
              <AlertCircle className="text-rose-600 flex-shrink-0" size={24} />
              <p className="text-rose-900 font-semibold text-sm flex-1">{errorMessage}</p>
              <button 
                onClick={() => setErrorMessage('')} 
                className="text-rose-600 hover:text-rose-800 font-bold text-xl"
              >
                ×
              </button>
            </div>
          )}
        </div>

        <main className="core-admin-main flex-1 overflow-y-auto">
          <div className="px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
            <div className="max-w-6xl mx-auto">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-400 mb-1">Administração / {activeNavItem.group}</p>
                  <h2 className="core-admin-heading text-2xl md:text-3xl font-extrabold tracking-tight">{activeNavItem.label}</h2>
                  <p className="core-admin-subheading text-sm mt-1">{activeNavItem.description}</p>
                </div>
                {hasTab('new-booking') && activeTab !== 'new-booking' && (
                  <button onClick={() => setActiveTab('new-booking')} className="core-button-primary hidden sm:inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold transition-colors shadow-sm">
                    <CalendarPlus size={17} /> Novo agendamento
                  </button>
                )}
              </div>

              <div>
                {activeTab === 'overview' && (
                  <AdminOverviewTab 
                    formatBRL={formatBRL}
                    getProfessionalName={getProfessionalName}
                    getServiceName={getServiceName}
                    handleUpdateBookingStatus={handleUpdateBookingStatus}
                    onViewFullReport={() => setActiveTab('reports')}
                    canViewReports={hasTab('reports')}
                    showFeedback={showFeedback}
                  />
                )}

                {hasTab('new-booking') && activeTab === 'new-booking' && (
                  <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-xl p-5 sm:p-7 shadow-sm">
                    <div className="mb-6">
                      <h2 className="text-xl font-extrabold text-slate-900">Criar novo agendamento</h2>
                      <p className="text-sm text-slate-500 mt-1">Escolha profissional e serviço para consultar a disponibilidade real.</p>
                    </div>
                    <AdminBookingForm showFeedback={showFeedback} onSuccess={() => setActiveTab('overview')} />
                  </div>
                )}

                {hasTab('reports') && activeTab === 'reports' && <AdminReportsTab formatBRL={formatBRL} />}

                {hasTab('services') && activeTab === 'services' && (
                  <AdminServicesTab
                    formatBRL={formatBRL}
                    setSuccessMessage={setSuccessMessage}
                    setErrorMessage={setErrorMessage}
                  />
                )}

                {hasTab('professionals') && activeTab === 'professionals' && (
                  <AdminProfessionalsTab
                    setSuccessMessage={setSuccessMessage}
                    setErrorMessage={setErrorMessage}
                  />
                )}

                {activeTab === 'gallery' && (
                  <AdminGalleryTab
                    setSuccessMessage={setSuccessMessage}
                    setErrorMessage={setErrorMessage}
                  />
                )}

                {hasTab('pets') && activeTab === 'pets' && <AdminPetsTab />}

                {hasTab('clients') && activeTab === 'clients' && <AdminClientsTab formatBRL={formatBRL} />}

                {hasTab('agenda') && activeTab === 'agenda' && <AdminAgendaTab showFeedback={showFeedback} />}

                {activeTab === 'accounts' && <AdminAccountsTab showFeedback={showFeedback} />}

                {activeTab === 'appearance' && <AdminAppearanceTab showFeedback={showFeedback} />}

                {activeTab === 'settings' && <AdminSettingsTab showFeedback={showFeedback} />}
              </div>
            </div>
          </div>
        </main>
      </div>

      {isMobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          <nav className="core-admin-sidebar fixed left-0 top-0 h-screen w-72 flex flex-col z-30 md:hidden shadow-2xl">
            <div className="p-6 border-b border-white/10">
              <BusinessBrand size="md" nameClassName="max-w-44 text-white" />
              <p className="mt-2 text-[10px] font-bold text-white/50 uppercase tracking-wider">Painel Administrativo</p>
            </div>

            <div className="flex-1 px-3 py-5 overflow-y-auto">{renderNavigation(() => setIsMobileMenuOpen(false))}</div>

            <div className="p-6 border-t border-slate-700/50 space-y-4">
              <div className="flex items-center gap-4 px-3 py-4 bg-slate-800/30 rounded-xl">
                <div className="core-admin-avatar w-12 h-12 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  {currentUser?.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm truncate">{compactUserName}</p>
                  <p className="text-xs text-slate-400 truncate">{currentUser?.email}</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-slate-800/50 hover:bg-rose-500/10 text-slate-300 hover:text-rose-400 transition-all border border-slate-700/50 flex items-center justify-center gap-2"
              >
                <LogOut size={16} />
                Sair
              </button>
            </div>
          </nav>
        </>
      )}
    </div>
  );
};

export const AdminDashboard = withRoleGuard(AdminDashboardInner, ['owner', 'admin']);
