import React, { useState } from 'react';
import { KeyRound, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabaseAuthProvider } from '../auth/services/supabaseAuthProvider';
import { getErrorMessage } from '../utils/errors';
import { getPasswordValidationError, MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from '../auth/passwordPolicy';

interface ResetPasswordViewProps {
  onComplete: () => void;
}

/**
 * Renderizada no lugar de todo o resto do app quando o usuário chega pelo
 * link de "recuperar senha" enviado por e-mail (ver
 * `useAuthStore.passwordRecoveryMode`). Sem isso, o link do e-mail não
 * tinha para onde ir.
 */
export const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({ onComplete }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const passwordError = getPasswordValidationError(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const result = await supabaseAuthProvider.updatePassword(password);
      if (!result.success) {
        setError(result.error || 'Não foi possível atualizar a senha.');
        return;
      }
      setPassword('');
      setConfirmPassword('');
      setDone(true);
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível atualizar a senha.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        {done ? (
          <div className="text-center">
            <div className="w-14 h-14 mx-auto bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 size={28} />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight mb-2">Senha atualizada!</h1>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              Sua senha foi alterada com sucesso. Você já pode continuar usando sua conta.
            </p>
            <button
              onClick={onComplete}
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-colors"
            >
              Continuar
            </button>
          </div>
        ) : (
          <>
            <div className="w-14 h-14 mx-auto bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
              <KeyRound size={26} />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight text-center mb-1">Definir nova senha</h1>
            <p className="text-sm text-slate-500 text-center leading-relaxed mb-6">
              Escolha uma nova senha com pelo menos {MIN_PASSWORD_LENGTH} caracteres.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="new-password" className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Nova senha
                </label>
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                  placeholder="••••••••"
                  minLength={MIN_PASSWORD_LENGTH}
                  maxLength={MAX_PASSWORD_LENGTH}
                  required
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Confirmar nova senha
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                  placeholder="••••••••"
                  minLength={MIN_PASSWORD_LENGTH}
                  maxLength={MAX_PASSWORD_LENGTH}
                  required
                />
              </div>

              {error && (
                <div role="alert" className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Salvando...' : 'Salvar nova senha'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
