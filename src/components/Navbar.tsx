import React, { useEffect, useState } from 'react';
import { Calendar, LogIn, LogOut, Menu, X } from 'lucide-react';
import { useApp } from '../store/useApp';
import { UserRole } from '../types';
import { getCompactDisplayName } from '../utils/displayName';
import { getRoleLabel, isAdministratorRole, isCustomerRole, isProfessionalRole } from '../auth/authorization';
import { useNiche } from '../core/business/hooks';
import { NicheMark } from '../features/landing/NicheMark';

interface NavbarProps {
  onNavigate: (page: 'landing' | 'booking' | 'customer' | 'admin' | 'professional') => void;
  currentPage: string;
  onOpenLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage, onOpenLogin }) => {
  const { currentUser, logout, config } = useApp();
  const niche = useNiche();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => {
    const closeAtDesktop = () => { if (window.innerWidth >= 768) setMobileMenuOpen(false); };
    window.addEventListener('resize', closeAtDesktop);
    return () => window.removeEventListener('resize', closeAtDesktop);
  }, []);
  const compactUserName = currentUser ? getCompactDisplayName(currentUser.name) : '';

  const getRoleBadge = (role: UserRole) => (
    <span className={`${isAdministratorRole(role) ? 'bg-red-500' : isProfessionalRole(role) ? 'bg-blue-500' : 'bg-emerald-500'} rounded px-1.5 py-0.5 text-[10px] font-bold text-white uppercase`}>
      {getRoleLabel(role)}
    </span>
  );

  const navClass = (active: boolean) => `core-public-ring text-sm font-semibold transition-opacity ${active ? 'core-public-primary-text' : 'core-public-muted-text hover:opacity-75'}`;

  return (
    <header className="core-public-surface core-public-border sticky top-0 z-40 border-b">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <button aria-label="Ir para o início" className="core-public-ring flex min-w-0 items-center gap-2 text-left" onClick={() => onNavigate('landing')}>
            <div className="core-public-primary grid size-10 place-items-center rounded-xl">
              <NicheMark nicheId={niche.id} size={20} aria-hidden="true" />
            </div>
            <span className="truncate text-xl font-black tracking-tight">{config?.name || 'Agenda'}</span>
          </button>

          <div className="hidden items-center gap-6 md:flex">
            <button onClick={() => onNavigate('landing')} className={navClass(currentPage === 'landing')}>Início</button>
            <button onClick={() => onNavigate('booking')} className={`${navClass(currentPage === 'booking')} flex items-center gap-1.5`}>
              <Calendar size={16} /> Agendar
            </button>

            {currentUser && (
              <>
                {isCustomerRole(currentUser.role) && <button onClick={() => onNavigate('customer')} className={navClass(currentPage === 'customer')}>Meus Agendamentos</button>}
                {isProfessionalRole(currentUser.role) && <button onClick={() => onNavigate('professional')} className={navClass(currentPage === 'professional')}>Minha Agenda</button>}
                {isAdministratorRole(currentUser.role) && <button onClick={() => onNavigate('admin')} className={navClass(currentPage === 'admin')}>Painel Gerencial</button>}
              </>
            )}

            {currentUser ? (
              <div className="core-public-muted core-public-border flex items-center gap-3 rounded-full border py-1 pr-2 pl-3">
                <div className="text-right">
                  <p className="text-xs leading-none font-semibold">{compactUserName}</p>
                  <div className="mt-0.5 leading-none">{getRoleBadge(currentUser.role)}</div>
                </div>
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="core-public-border size-8 rounded-full border object-cover" />
                ) : (
                  <div className="core-public-secondary flex size-8 items-center justify-center rounded-full text-xs font-bold uppercase">{currentUser.name.charAt(0)}</div>
                )}
                <button id="logout-btn" onClick={logout} className="core-public-ring core-public-muted-text rounded-full p-1.5 transition-opacity hover:opacity-70" title="Sair" aria-label="Sair">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button id="login-btn-nav" onClick={onOpenLogin} className="core-public-primary core-public-ring flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-opacity hover:opacity-90">
                <LogIn size={16} /> Entrar
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={mobileMenuOpen} className="core-public-muted core-public-ring grid size-11 place-items-center rounded-lg">
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="core-public-surface core-public-border space-y-2 border-t px-4 py-3 md:hidden">
          <button onClick={() => { onNavigate('landing'); setMobileMenuOpen(false); }} className="core-public-ring min-h-11 w-full rounded-lg px-3 py-2 text-left text-sm">Início</button>
          <button onClick={() => { onNavigate('booking'); setMobileMenuOpen(false); }} className="core-public-primary core-public-ring flex min-h-11 w-full items-center gap-1.5 rounded-lg px-3 py-2 text-left text-sm font-medium">
            <Calendar size={14} /> Agendar Online
          </button>
          {currentUser && (
            <>
              {isCustomerRole(currentUser.role) && <button onClick={() => { onNavigate('customer'); setMobileMenuOpen(false); }} className="core-public-ring min-h-11 w-full rounded-lg px-3 py-2 text-left text-sm">Meus Agendamentos</button>}
              {isProfessionalRole(currentUser.role) && <button onClick={() => { onNavigate('professional'); setMobileMenuOpen(false); }} className="core-public-ring min-h-11 w-full rounded-lg px-3 py-2 text-left text-sm">Minha Agenda</button>}
              {isAdministratorRole(currentUser.role) && <button onClick={() => { onNavigate('admin'); setMobileMenuOpen(false); }} className="core-public-ring min-h-11 w-full rounded-lg px-3 py-2 text-left text-sm">Painel Gerencial</button>}
            </>
          )}
          <div className="core-public-border flex flex-col gap-2 border-t pt-3">
            {currentUser ? (
              <div className="core-public-muted core-public-border flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  {currentUser.avatar ? <img src={currentUser.avatar} alt={currentUser.name} className="size-8 rounded-full object-cover" /> : <div className="core-public-secondary flex size-8 items-center justify-center rounded-full text-xs font-bold">{currentUser.name.charAt(0)}</div>}
                  <div><p className="text-xs font-semibold">{compactUserName}</p><div className="mt-0.5">{getRoleBadge(currentUser.role)}</div></div>
                </div>
                <button onClick={() => { void logout(); setMobileMenuOpen(false); }} className="core-public-ring core-public-muted-text rounded-lg p-2" aria-label="Sair"><LogOut size={16} /></button>
              </div>
            ) : (
              <button onClick={() => { onOpenLogin(); setMobileMenuOpen(false); }} className="core-public-primary core-public-ring flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-center text-sm font-semibold"><LogIn size={16} /> Entrar</button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
