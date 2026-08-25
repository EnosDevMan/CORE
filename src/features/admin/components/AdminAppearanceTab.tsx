import { useEffect, useMemo, useState } from 'react';
import { Check, LayoutTemplate, Palette, Save } from 'lucide-react';
import { businessService } from '../../../core/business/businessService';
import { useBusiness, useNiche } from '../../../core/business/hooks';
import { PUBLIC_LAYOUT_REGISTRY } from '../../../layouts/registry';
import { THEME_REGISTRY } from '../../../themes/registry';
import type { ThemeId } from '../../../themes/types';
import { getErrorMessage } from '../../../utils/errors';

interface AdminAppearanceTabProps {
  showFeedback: (msg: string, isError: boolean) => void;
}

export function AdminAppearanceTab({ showFeedback }: AdminAppearanceTabProps) {
  const niche = useNiche();
  const { profile, refreshRuntime } = useBusiness();
  const [selectedThemeId, setSelectedThemeId] = useState<ThemeId>(profile.themeId);
  const [saving, setSaving] = useState(false);

  useEffect(() => setSelectedThemeId(profile.themeId), [profile.themeId]);

  const themes = useMemo(() => niche.recommendedThemeIds
    .map(id => THEME_REGISTRY[id as ThemeId])
    .filter((theme): theme is NonNullable<typeof theme> => Boolean(theme)), [niche.recommendedThemeIds]);
  const layout = PUBLIC_LAYOUT_REGISTRY[niche.defaultLayoutId];

  const saveTheme = async () => {
    if (saving || selectedThemeId === profile.themeId) return;
    try {
      setSaving(true);
      await businessService.updateTheme(selectedThemeId, profile.nicheId);
      await refreshRuntime();
      showFeedback('Tema do site atualizado com sucesso!', false);
    } catch (error) {
      setSelectedThemeId(profile.themeId);
      showFeedback(getErrorMessage(error, 'Não foi possível atualizar o tema do site.'), true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-900 text-white"><LayoutTemplate size={20} /></div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Design otimizado para {niche.name}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">O CORE usa uma estrutura pública própria para cada nicho, mantendo os mesmos componentes de negócio e acessibilidade.</p>
          </div>
        </div>
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Layout atual</p>
          <p className="mt-1 font-extrabold text-slate-900">{layout.name}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{layout.description}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-800"><Palette size={20} /></div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Tema e identidade visual</h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">As opções abaixo foram selecionadas para {niche.name}. O tema altera cores, contraste, superfícies, bordas e acabamento sem trocar o conteúdo do negócio.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={saveTheme}
            disabled={saving || selectedThemeId === profile.themeId}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Save size={17} /> {saving ? 'Aplicando...' : 'Aplicar tema'}
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {themes.map(theme => {
            const selected = theme.id === selectedThemeId;
            const active = theme.id === profile.themeId;
            return (
              <label key={theme.id} className={`relative cursor-pointer rounded-2xl border p-4 transition-all ${selected ? 'border-slate-900 ring-2 ring-slate-900/10' : 'border-slate-200 hover:border-slate-400'}`}>
                <input className="sr-only" type="radio" name="public-theme" value={theme.id} checked={selected} onChange={() => setSelectedThemeId(theme.id)} />
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-2" aria-hidden="true">
                    {[theme.tokens.primary, theme.tokens.accent, theme.tokens.background, theme.tokens.surface].map((color, index) => (
                      <span key={`${theme.id}-${index}`} className="size-8 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                  {selected && <span className="grid size-7 place-items-center rounded-full bg-slate-900 text-white"><Check size={15} /></span>}
                </div>
                <div className="mt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-sm text-slate-900">{theme.name}</strong>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">{theme.mode === 'dark' ? 'Escuro' : 'Claro'}</span>
                    {active && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">Em uso</span>}
                  </div>
                  <p className="mt-2 text-sm leading-5 text-slate-500">{theme.description}</p>
                </div>
              </label>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
        <strong className="text-slate-900">Personalização sem acoplamento:</strong> textos do hero, informações do estabelecimento, serviços, equipe e galeria continuam configuráveis separadamente. Trocar o tema não apaga nem reescreve conteúdo.
      </section>
    </div>
  );
}
