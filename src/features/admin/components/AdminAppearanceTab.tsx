import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Check, Image as ImageIcon, Palette, Sparkles, Trash2, Upload } from 'lucide-react';
import { BusinessBrand } from '../../../core/business/BusinessBrand';
import { businessService } from '../../../core/business/businessService';
import { prepareCoverImage } from '../../../core/business/coverImage';
import { renderCroppedLogo, validateLogoFile, type LogoCropOptions } from '../../../core/business/logoCrop';
import { useBusiness, useNiche } from '../../../core/business/hooks';
import { AppearancePicker } from '../../../themes/AppearancePicker';
import type { CustomPaletteColors } from '../../../themes/types';
import { LogoCropDialog } from './LogoCropDialog';

const sameCustomPalette = (a?: CustomPaletteColors, b?: CustomPaletteColors) =>
  a?.primary === b?.primary && a?.secondary === b?.secondary && a?.accent === b?.accent;

export function AdminAppearanceTab({ showFeedback }: { showFeedback: (msg: string, isError: boolean) => void }) {
  const niche = useNiche();
  const { profile, refreshRuntime } = useBusiness();
  const [selectedStyleId, setSelectedStyleId] = useState(profile.themeStyleId);
  const [selectedPaletteId, setSelectedPaletteId] = useState(profile.paletteId);
  const [selectedSurfaceMode, setSelectedSurfaceMode] = useState(profile.surfaceMode);
  const [selectedCustomColors, setSelectedCustomColors] = useState<CustomPaletteColors | undefined>(profile.customPalette);
  const [savingAppearance, setSavingAppearance] = useState(false);
  const [pendingLogo, setPendingLogo] = useState<File | null>(null);
  const [savingLogo, setSavingLogo] = useState(false);
  const [savingCover, setSavingCover] = useState(false);
  const [logoError, setLogoError] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedStyleId(profile.themeStyleId);
    setSelectedPaletteId(profile.paletteId);
    setSelectedSurfaceMode(profile.surfaceMode);
    setSelectedCustomColors(profile.customPalette);
  }, [profile.customPalette, profile.paletteId, profile.surfaceMode, profile.themeStyleId]);

  const appearanceChanged = selectedStyleId !== profile.themeStyleId
    || selectedPaletteId !== profile.paletteId
    || selectedSurfaceMode !== profile.surfaceMode
    || (selectedPaletteId === 'custom' && !sameCustomPalette(selectedCustomColors, profile.customPalette));

  const resetAppearance = () => {
    setSelectedStyleId(profile.themeStyleId);
    setSelectedPaletteId(profile.paletteId);
    setSelectedSurfaceMode(profile.surfaceMode);
    setSelectedCustomColors(profile.customPalette);
  };

  const saveAppearance = async () => {
    if (savingAppearance || !appearanceChanged || profile.nicheId === 'core_bootstrap') return;
    try {
      setSavingAppearance(true);
      await businessService.updateAppearance({
        styleId: selectedStyleId,
        paletteId: selectedPaletteId,
        surfaceMode: selectedSurfaceMode,
        customColors: selectedPaletteId === 'custom' ? selectedCustomColors : undefined,
      }, profile.nicheId);
      await refreshRuntime();
      showFeedback('Aparência do site atualizada com sucesso!', false);
    } catch (error) {
      resetAppearance();
      showFeedback(error instanceof Error ? error.message : 'Não foi possível atualizar a aparência do site.', true);
    } finally {
      setSavingAppearance(false);
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

  const chooseCover = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || savingCover) return;
    try {
      setSavingCover(true);
      const optimizedCover = await prepareCoverImage(file);
      await businessService.replaceCover(optimizedCover);
      await refreshRuntime();
      showFeedback('Imagem de destaque atualizada no site!', false);
    } catch (error) {
      showFeedback(error instanceof Error ? error.message : 'Não foi possível atualizar a imagem de destaque.', true);
    } finally {
      setSavingCover(false);
    }
  };

  const removeCover = async () => {
    if (!profile.coverUrl || savingCover) return;
    if (!window.confirm('Remover a imagem de destaque personalizada?')) return;
    try {
      setSavingCover(true);
      await businessService.removeCover();
      await refreshRuntime();
      showFeedback('Imagem de destaque removida. O site voltará a usar a galeria ou o visual padrão do tema.', false);
    } catch (error) {
      showFeedback(error instanceof Error ? error.message : 'Não foi possível remover a imagem de destaque.', true);
    } finally {
      setSavingCover(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-slate-100 p-2.5 text-slate-700"><ImageIcon size={20} /></span>
            <div>
              <h3 className="font-extrabold text-slate-900">Imagem de destaque</h3>
              <p className="mt-1 text-sm text-slate-500">É a principal imagem visual do início da página e ajuda o cliente a entender o negócio antes de agendar.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-5 lg:grid-cols-[minmax(280px,.9fr)_minmax(320px,1.1fr)] sm:p-6">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
            {profile.coverUrl ? (
              <img src={profile.coverUrl} alt="Imagem de destaque atual do negócio" className="aspect-[8/5] h-full w-full object-cover" />
            ) : (
              <div className="flex aspect-[8/5] min-h-48 flex-col items-center justify-center gap-2 p-6 text-center text-slate-400">
                <ImageIcon size={34} />
                <p className="text-sm font-bold text-slate-600">Nenhuma imagem personalizada</p>
                <p className="max-w-xs text-xs leading-5">O CORE usa automaticamente a primeira foto da galeria e, se ela não existir, o visual padrão do tema.</p>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center">
            <p className="text-sm font-bold text-slate-800">{profile.coverUrl ? 'Imagem personalizada ativa' : 'Modo automático ativo'}</p>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Use uma foto real de trabalho, resultado, ambiente ou uma ilustração da própria marca. O arquivo é otimizado no navegador antes do envio para reduzir o peso da página. JPG, PNG ou WEBP, até 5 MB.
            </p>
            <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseCover} className="sr-only" aria-label="Selecionar imagem de destaque" />
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" onClick={() => coverInputRef.current?.click()} disabled={savingCover} className="core-button-primary min-h-11 px-4 text-sm font-bold disabled:opacity-50">
                <Upload size={17} /> {savingCover ? 'Otimizando...' : profile.coverUrl ? 'Trocar imagem' : 'Enviar imagem'}
              </button>
              {profile.coverUrl && (
                <button type="button" onClick={removeCover} disabled={savingCover} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-rose-200 px-4 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50">
                  <Trash2 size={17} /> Remover
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-slate-100 p-2.5 text-slate-700"><ImageIcon size={20} /></span>
            <div>
              <h3 className="font-extrabold text-slate-900">Logo da empresa</h3>
              <p className="mt-1 text-sm text-slate-500">Substitui o ícone genérico no site, no painel e na aba do navegador.</p>
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
            <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseLogo} className="sr-only" aria-label="Selecionar arquivo de logo" />
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" onClick={() => logoInputRef.current?.click()} disabled={savingLogo} className="core-button-primary min-h-11 px-4 text-sm font-bold disabled:opacity-50">
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
              <h3 className="font-extrabold text-slate-900">Aparência do site</h3>
              <p className="mt-1 text-sm text-slate-500">Escolha o desenho, as cores da marca e o fundo separadamente. O painel administrativo continua neutro.</p>
            </div>
          </div>
          <button type="button" onClick={saveAppearance} disabled={savingAppearance || !appearanceChanged} className="core-button-primary min-h-11 shrink-0 justify-center px-5 text-sm font-bold disabled:opacity-40">
            {savingAppearance ? <Sparkles className="animate-pulse" size={17} /> : <Check size={17} />}
            {savingAppearance ? 'Aplicando...' : appearanceChanged ? 'Salvar aparência' : 'Aparência em uso'}
          </button>
        </div>

        <div className="mt-6">
          {profile.nicheId !== 'core_bootstrap' && (
            <AppearancePicker
              nicheId={profile.nicheId}
              styleId={selectedStyleId}
              paletteId={selectedPaletteId}
              surfaceMode={selectedSurfaceMode}
              customColors={selectedCustomColors}
              onStyleChange={setSelectedStyleId}
              onPaletteChange={setSelectedPaletteId}
              onSurfaceModeChange={setSelectedSurfaceMode}
              onCustomColorsChange={setSelectedCustomColors}
            />
          )}
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
