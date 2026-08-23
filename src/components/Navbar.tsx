import React, { useEffect, useState } from 'react';
import { Calendar, Scissors, LogIn, LogOut, Menu, X } from 'lucide-react';
import { useApp } from '../store/useApp';
import { UserRole } from '../types';
import { getCompactDisplayName } from '../utils/displayName';
import { getRoleLabel, isAdministratorRole, isCustomerRole, isProfessionalRole } from '../auth/authorization';

interface NavbarProps {
  onNavigate: (page: 'landing' | 'booking' | 'customer' | 'admin' | 'professional') => void;
  currentPage: string;
  onOpenLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage, onOpenLogin }) => {
  const { currentUser, logout, config } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => {
    const closeAtDesktop = () => { if (window.innerWidth >= 768) setMobileMenuOpen(false); };
    window.addEventListener('resize', closeAtDesktop);
    return () => window.removeEventListener('resize', closeAtDesktop);
  }, []);
  const compactUserName = currentUser ? getCompactDisplayName(currentUser.name) : '';

  const getRoleBadge = (role: UserRole) => (
    <span className={`${isAdministratorRole(role) ? 'bg-red-500' : isProfessionalRole(role) ? 'bg-blue-500' : 'bg-emerald-500'} text-white text-[10px] px-1.5 py-0.5 rounded uppercase font-bold`}>
      {getRoleLabel(role)}
    </span>
  );

  return (
    <header className="bg-brand-navy text-slate-100 border-b border-white/10 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <button aria-label="Ir para o início" className="flex min-w-0 items-center gap-2 text-left" onClick={() => onNavigate('landing')}>
            <div className="bg-brand-copper p-2 rounded-xl">
              <Scissors size={20} className="text-white" />
            </div>
            <span className="text-xl font-black tracking-tight">{config?.name || 'Agenda'}</span>
          </button>

          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => onNavigate('landing')} className={`text-sm font-semibold transition-colors ${currentPage === 'landing' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}>
              Início
            </button>
            <button onClick={() => onNavigate('booking')} className={`text-sm font-semibold transition-colors flex items-center gap-1.5 ${currentPage === 'booking' ? 'text-brand-copper' : 'text-slate-400 hover:text-slate-200'}`}>
              <Calendar size={16} /> Agendar
            </button>

            {currentUser && (
              <>
                {isCustomerRole(currentUser.role) && (
                  <button onClick={() => onNavigate('customer')} className={`text-sm font-semibold transition-colors ${currentPage === 'customer' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                    Meus Agendamentos
                  </button>
                )}
                {isProfessionalRole(currentUser.role) && (
                  <button onClick={() => onNavigate('professional')} className={`text-sm font-semibold transition-colors ${currentPage === 'professional' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                    Minha Agenda
                  </button>
                )}
                {isAdministratorRole(currentUser.role) && (
                  <button onClick={() => onNavigate('admin')} className={`text-sm font-semibold transition-colors ${currentPage === 'admin' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                    Painel Gerencial
                  </button>
                )}
              </>
            )}

            {currentUser ? (
              <div className="flex items-center gap-3 bg-slate-800 pl-3 pr-2 py-1 rounded-full border border-slate-700">
                <div className="text-right">
                  <p className="text-xs font-semibold leading-none">{compactUserName}</p>
                  <div className="mt-0.5 leading-none">{getRoleBadge(currentUser.role)}</div>
                </div>
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-8 h-8 rounded-full object-cover border border-slate-600" />
                ) : (
                  <div className="w-8 h-8 bg-slate-700 text-slate-200 rounded-full flex items-center justify-center text-xs font-bold uppercase">
                    {currentUser.name.charAt(0)}
                  </div>
                )}
                <button
                  id="logout-btn"
                  onClick={logout}
                  className="text-slate-400 hover:text-white hover:bg-slate-700 p-1.5 rounded-full transition-colors cursor-pointer"
                  title="Sair"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                id="login-btn-nav"
                onClick={onOpenLogin}
                className="bg-brand-copper text-brand-navy font-semibold text-sm px-4 py-2 rounded-lg hover:bg-brand-copper-light transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <LogIn size={16} /> Entrar
              </button>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={mobileMenuOpen} className="grid size-11 place-items-center bg-brand-navy-soft rounded-lg text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-brand-navy border-t border-white/10 py-3 px-4 space-y-2">
          <button
            onClick={() => { onNavigate('landing'); setMobileMenuOpen(false); }}
            className="min-h-11 w-full text-left py-2 px-3 rounded-lg text-sm text-slate-200 hover:bg-white/5"
          >
            Início
          </button>
          <button
            onClick={() => { onNavigate('booking'); setMobileMenuOpen(false); }}
            className="min-h-11 w-full text-left py-2 px-3 rounded-lg text-sm bg-brand-copper text-brand-navy font-medium flex items-center gap-1.5"
          >
            <Calendar size={14} /> Agendar Online
          </button>
          {currentUser && (
            <>
              {isCustomerRole(currentUser.role) && (
                <button
                  onClick={() => { onNavigate('customer'); setMobileMenuOpen(false); }}
                  className="min-h-11 w-full text-left py-2 px-3 rounded-lg text-sm text-slate-200 hover:bg-white/5"
                >
                  Meus Agendamentos
                </button>
              )}
              {isProfessionalRole(currentUser.role) && (
                <button
                  onClick={() => { onNavigate('professional'); setMobileMenuOpen(false); }}
                  className="min-h-11 w-full text-left py-2 px-3 rounded-lg text-sm text-slate-200 hover:bg-white/5"
                >
                  Minha Agenda
                </button>
              )}
              {isAdministratorRole(currentUser.role) && (
                <button
                  onClick={() => { onNavigate('admin'); setMobileMenuOpen(false); }}
                  className="min-h-11 w-full text-left py-2 px-3 rounded-lg text-sm text-slate-200 hover:bg-white/5"
                >
                  Painel Gerencial
                </button>
              )}
            </>
          )}
          <div className="border-t border-white/10 pt-3 flex flex-col gap-2">
            {currentUser ? (
              <div className="flex items-center justify-between bg-brand-navy-soft p-3 rounded-lg border border-white/10">
                <div className="flex items-center gap-2">
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 bg-slate-800 text-slate-300 rounded-full flex items-center justify-center text-xs font-bold">
                      {currentUser.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold">{compactUserName}</p>
                    <div className="mt-0.5">{getRoleBadge(currentUser.role)}</div>
                  </div>
                </div>
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="text-slate-400 hover:text-white p-2 rounded-lg"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { onOpenLogin(); setMobileMenuOpen(false); }}
                className="w-full bg-slate-800 text-white text-center py-2 px-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5"
              >
                <LogIn size={16} /> Entrar
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
