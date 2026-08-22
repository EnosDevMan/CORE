import React, { useState } from 'react';
import { X, LogIn, UserPlus, KeyRound, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../auth/hooks/useAuth';
import { supabaseAuthProvider } from '../auth/services/supabaseAuthProvider';
import { getErrorMessage } from '../utils/errors';
import { validateEmail, validatePhoneBR } from '../utils/validation';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPrivacy: () => void;
}

type Mode = 'login' | 'register' | 'forgot';

const inputClass =
  'w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow';

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onOpenPrivacy }) => {
  const { login, register, loading, error: authError } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', onKey); };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const resetFields = () => {
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setLocalError('');
    setResetSent(false);
    setPendingConfirmation(false);
    setPrivacyConsent(false);
    setSendingReset(false);
  };

  const switchMode = (next: Mode) => {
    resetFields();
    setMode(next);
  };

  const handleClose = () => {
    resetFields();
    setMode('login');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (mode === 'forgot') {
      if (!validateEmail(email)) {
        setLocalError('Informe um e-mail válido.');
        return;
      }
      setSendingReset(true);
      try {
        const result = await supabaseAuthProvider.sendPasswordResetEmail(email);
        if (!result.success) {
          setLocalError(result.error || 'Não foi possível enviar o e-mail de recuperação.');
          return;
        }
        setResetSent(true);
      } catch (err) {
        setLocalError(getErrorMessage(err, 'Não foi possível enviar o e-mail de recuperação.'));
      } finally {
        setSendingReset(false);
      }
      return;
    }

    if (mode === 'login') {
      if (!validateEmail(email)) {
        setLocalError('Informe um e-mail válido.');
        return;
      }
      if (!password) {
        setLocalError('Informe sua senha.');
        return;
      }
      const ok = await login({ email, password });
      if (ok) handleClose();
      return;
    }

    // mode === 'register'
    if (!name || !phone) {
      setLocalError('Por favor, preencha nome e telefone.');
      return;
    }
    if (!validateEmail(email)) {
      setLocalError('Informe um e-mail válido.');
      return;
    }
    if (!validatePhoneBR(phone)) {
      setLocalError('Informe um telefone válido, com DDD (ex: 11 91234-5678).');
      return;
    }
    if (password.length < 6) {
      setLocalError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (!privacyConsent) {
      setLocalError('É necessário concordar com a Política de Privacidade para criar uma conta.');
      return;
    }
    const result = await register({ name, email, phone, password });
    if (result === 'authenticated') {
      handleClose();
      return;
    }
    if (result === 'confirmation') setPendingConfirmation(true);
  };

  const displayError = localError || authError;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="auth-dialog-title" className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-md overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-250 border border-slate-100 flex flex-col max-h-[92vh]">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
          <h2 id="auth-dialog-title" className="text-xl font-black text-slate-900 tracking-tight">
            {mode === 'login' && 'Entrar'}
            {mode === 'register' && 'Criar conta'}
            {mode === 'forgot' && 'Recuperar senha'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto overscroll-contain p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {mode !== 'forgot' && (
            <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`flex-1 h-10 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-1.5 ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
              >
                <LogIn size={15} /> Entrar
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`flex-1 h-10 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-1.5 ${mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
              >
                <UserPlus size={15} /> Cadastrar
              </button>
            </div>
          )}

          {mode === 'forgot' && resetSent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 mx-auto bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                <KeyRound size={26} />
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Enviamos um link de recuperação para <strong>{email}</strong>. Confira sua caixa de entrada.
              </p>
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="mt-6 w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-colors"
              >
                Voltar para o login
              </button>
            </div>
          ) : mode === 'register' && pendingConfirmation ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 mx-auto bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                <UserPlus size={26} />
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Conta criada! Enviamos um link de confirmação para <strong>{email}</strong>. Confirme seu
                e-mail antes de entrar.
              </p>
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="mt-6 w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-colors"
              >
                Voltar para o login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {mode === 'register' && (
                <div>
                  <label htmlFor="name" className="block text-xs font-semibold text-slate-600 mb-1.5">Nome completo</label>
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className={inputClass}
                    placeholder="Seu nome"
                    required
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-slate-600 mb-1.5">E-mail</label>
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="voce@email.com"
                  required
                />
              </div>

              {mode === 'register' && (
                <div>
                  <label htmlFor="phone" className="block text-xs font-semibold text-slate-600 mb-1.5">Telefone (WhatsApp)</label>
                  <input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className={inputClass}
                    placeholder="(00) 00000-0000"
                    required
                  />
                </div>
              )}

              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="password" className="block text-xs font-semibold text-slate-600">Senha</label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => switchMode('forgot')}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                      >
                        Esqueci minha senha
                      </button>
                    )}
                  </div>
                  <input
                    id="password"
                    type="password"
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className={inputClass}
                    placeholder="••••••••"
                    minLength={6}
                    required
                  />
                </div>
              )}

              {mode === 'register' && (
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={privacyConsent}
                    onChange={e => setPrivacyConsent(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 shrink-0"
                  />
                  <span className="text-xs text-slate-500 leading-relaxed">
                    Li e concordo com a{' '}
                    <button
                      type="button"
                      onClick={onOpenPrivacy}
                      className="text-indigo-600 hover:text-indigo-500 font-semibold underline underline-offset-2"
                    >
                      Política de Privacidade
                    </button>
                    .
                  </span>
                </label>
              )}

              {displayError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{displayError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || sendingReset}
                className="w-full h-12 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 mt-2"
              >
                {(loading || sendingReset) && <Loader2 size={16} className="animate-spin" />}
                {mode === 'login' && (loading ? 'Entrando...' : 'Entrar')}
                {mode === 'register' && (loading ? 'Criando conta...' : 'Criar conta')}
                {mode === 'forgot' && (sendingReset ? 'Enviando...' : 'Enviar link de recuperação')}
              </button>

              {mode === 'forgot' && (
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="w-full h-11 text-slate-500 hover:text-slate-700 font-semibold text-sm transition-colors"
                >
                  Voltar
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
