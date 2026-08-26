import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Check, Image as ImageIcon, Palette, Sparkles, Trash2, Upload } from 'lucide-react';
import { BusinessBrand } from '../../../core/business/BusinessBrand';
import { businessService } from '../../../core/business/businessService';
import { renderCroppedLogo, validateLogoFile, type LogoCropOptions } from '../../../core/business/logoCrop';
import { useBusiness, useNiche } from '../../../core/business/hooks';
import { THEME_REGISTRY } from '../../../themes/registry';
import type { ThemeId } from '../../../themes/types';
import { LogoCropDialog } from './LogoCropDialog';

export function AdminAppearanceTab({ showFeedback }: { showFeedback: (msg: string, isError: boolean) => void }) {
  const niche = useNiche();
  const { profile, refreshRuntime } = useBusiness();
  const [selected, setSelected] = useState<ThemeId>(profile.themeId);
  const [savingTheme, setSavingTheme] = useState(false);
  const [pendingLogo, setPendingLogo] = useState<File | null>(null);
  const [savingLogo, setSavingLogo] = useState(false);
  const [logoError, setLogoError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setSelected(profile.themeId), [profile.themeId]);

  const saveTheme = async () => {
    if (savingTheme || selected === profile.themeId) return;
    try {
      setSavingTheme(true);
      await businessService.updateTheme(selected, profile.nicheId);
      await refreshRuntime();
      showFeedback('Tema do site atualizado com sucesso!', false);
    } catch (error) {
      setSelected(profile.themeId);
      showFeedback(error instanceof Error ? error.message : 'Não foi possível atualizar o tema do site.', true);
    } finally {
      setSavingTheme(false);
    }
  };

  const chooseLogo = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      validateLogoFile(file);
      setLogoError('');
      setPendingLogo(file);
    } catch (error) {
      showFeedback(error instanceof Error ? error.message : 'Arquivo de logo inválido.', true);
    }
  };

  const saveLogo = async (options: LogoCropOptions) => {
    if (!pendingLogo || savingLogo) return;
    try {
      setSavingLogo(true);
      setLogoError('');
      const optimizedLogo = await renderCroppedLogo(pendingLogo, options);
      await businessService.replaceLogo(optimizedLogo);
      await refreshRuntime();
      setPendingLogo(null);
      showFeedback('Logo atualizada no site e no ícone do navegador!', false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível atualizar a logo.';
      setLogoError(message);
      showFeedback(message, true);
    } finally {
      setSavingLogo(false);
    }
  };

  const removeLogo = async () => {
    if (!profile.logoUrl || savingLogo) return;
    if (!window.confirm('Remover a logo personalizada e voltar ao ícone do nicho?')) return;
    try {
      setSavingLogo(true);
      await businessService.removeLogo();
      await refreshRuntime();
      showFeedback('Logo personalizada removida.', false);
    } catch (error) {
      showFeedback(error instanceof Error ? error.message : 'Não foi possível remover a logo.', true);
    } finally {
      setSavingLogo(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-slate-100 p-2.5 text-slate-700"><ImageIcon size={20} /></span>
            <div>
              <h3 className="font-extrabold text-slate-900">Logo da empresa</h3>
              <p className="mt-1 text-sm text-slate-500">Substitui o ícone genérico em todo o site, no painel e na aba do navegador.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-5 sm:grid-cols-[minmax(220px,.7fr)_minmax(280px,1.3fr)] sm:p-6">
          <div className="core-brand-stage flex min-h-48 items-center justify-center rounded-2xl border border-slate-200 p-6">
            <BusinessBrand size="lg" className="max-w-full" nameClassName="max-w-48" />
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-sm font-bold text-slate-800">{profile.logoUrl ? 'Logo personalizada ativa' : `Ícone padrão de ${niche.name}`}</p>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Use uma imagem quadrada ou retangular. Você poderá ajustar zoom e posição antes de publicar. Aceitamos JPG, PNG ou WEBP de até 5 MB.
            </p>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseLogo} className="sr-only" aria-label="Selecionar arquivo de logo" />
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={savingLogo} className="core-button-primary min-h-11 px-4 text-sm font-bold disabled:opacity-50">
                <Upload size={17} /> {profile.logoUrl ? 'Trocar logo' : 'Enviar logo'}
              </button>
              {profile.logoUrl && (
                <button type="button" onClick={removeLogo} disabled={savingLogo} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-rose-200 px-4 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50">
                  <Trash2 size={17} /> Remover
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-slate-100 p-2.5 text-slate-700"><Palette size={20} /></span>
            <div>
              <h3 className="font-extrabold text-slate-900">Estilo visual</h3>
              <p className="mt-1 text-sm text-slate-500">Identidades criadas especialmente para {niche.name}, também aplicadas ao painel administrativo.</p>
            </div>
          </div>
          <button type="button" onClick={saveTheme} disabled={savingTheme || selected === profile.themeId} className="core-button-primary min-h-11 shrink-0 justify-center px-5 text-sm font-bold disabled:opacity-40">
            {savingTheme ? <Sparkles className="animate-pulse" size={17} /> : <Check size={17} />}
            {savingTheme ? 'Aplicando...' : selected === profile.themeId ? 'Tema em uso' : 'Aplicar tema'}
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {niche.recommendedThemeIds.map(themeId => {
            const id = themeId as ThemeId;
            const theme = THEME_REGISTRY[id];
            const isSelected = selected === id;
            const isActive = profile.themeId === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSelected(id)}
                aria-pressed={isSelected}
                className={`core-theme-choice overflow-hidden border-2 text-left transition-all ${isSelected ? 'is-selected -translate-y-0.5 shadow-lg' : 'border-transparent hover:-translate-y-0.5 hover:shadow-md'}`}
                style={{ borderColor: isSelected ? theme.tokens.primary : theme.tokens.border, background: theme.tokens.surface }}
              >
                <span className="block h-28 p-3" style={{ background: theme.tokens.heroGradient, color: theme.tokens.foreground }}>
                  <span className="flex h-6 items-center justify-between rounded-md px-2" style={{ background: theme.tokens.nav, color: theme.tokens.navForeground }}>
                    <span className="h-1.5 w-12 rounded-full bg-current opacity-80" />
                    <span className="h-3 w-8 rounded-full" style={{ background: theme.tokens.accent }} />
                  </span>
                  <span className="mt-4 block h-2 w-16 rounded-full" style={{ background: theme.tokens.primary }} />
                  <span className="mt-2 block h-4 w-3/4 rounded-sm bg-current opacity-80" />
                  <span className="mt-2 flex gap-1.5">
                    {[theme.tokens.primary, theme.tokens.accent, theme.tokens.decorative].map(color => <span key={color} className="h-4 w-4 rounded-full border border-black/5" style={{ background: color }} />)}
                  </span>
                </span>
                <span className="block p-4" style={{ color: theme.tokens.foreground }}>
                  <span className="flex items-center justify-between gap-2">
                    <strong className="text-sm">{theme.name}</strong>
                    {isActive && <span className="rounded-full px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider" style={{ background: theme.tokens.decorative, color: theme.tokens.decorativeForeground }}>Ativo</span>}
                  </span>
                  <span className="mt-1.5 block text-xs leading-5 opacity-70">{theme.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {pendingLogo && (
        <LogoCropDialog
          file={pendingLogo}
          saving={savingLogo}
          error={logoError}
          onCancel={() => { setPendingLogo(null); setLogoError(''); }}
          onConfirm={saveLogo}
        />
      )}
    </div>
  );
}
