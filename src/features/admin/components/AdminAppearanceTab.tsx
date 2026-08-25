import { useEffect, useState } from 'react';
import { businessService } from '../../../core/business/businessService';
import { useBusiness, useNiche } from '../../../core/business/hooks';
import { THEME_REGISTRY } from '../../../themes/registry';
import type { ThemeId } from '../../../themes/types';
import { getErrorMessage } from '../../../utils/errors';

export function AdminAppearanceTab({ showFeedback }: { showFeedback: (msg: string, isError: boolean) => void }) {
  const niche = useNiche();
  const { profile, refreshRuntime } = useBusiness();
  const [selected, setSelected] = useState<ThemeId>(profile.themeId);
  const [saving, setSaving] = useState(false);
  const theme = THEME_REGISTRY[selected];

  useEffect(() => setSelected(profile.themeId), [profile.themeId]);

  const save = async () => {
    if (saving || selected === profile.themeId) return;
    try {
      setSaving(true);
      await businessService.updateTheme(selected, profile.nicheId);
      await refreshRuntime();
      showFeedback('Tema do site atualizado com sucesso!', false);
    } catch (error) {
      setSelected(profile.themeId);
      showFeedback(getErrorMessage(error, 'Não foi possível atualizar o tema do site.'), true);
    } finally {
      setSaving(false);
    }
  };

  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <h3 className="font-extrabold text-slate-900">Aparência do site</h3>
    <p className="mt-1 text-sm text-slate-500">Identidades visuais selecionadas para {niche.name}.</p>
    <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
      <label className="text-sm font-bold text-slate-700">Tema
        <select value={selected} onChange={event => setSelected(event.target.value as ThemeId)} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-medium">
          {niche.recommendedThemeIds.map(id => <option key={id} value={id}>{THEME_REGISTRY[id as ThemeId].name}</option>)}
        </select>
      </label>
      <button type="button" onClick={save} disabled={saving || selected === profile.themeId} className="min-h-11 rounded-xl bg-slate-900 px-5 text-sm font-bold text-white disabled:opacity-40">{saving ? 'Aplicando...' : 'Aplicar tema'}</button>
    </div>
    <div className="mt-4 flex items-center gap-2" aria-label={`Prévia de ${theme.name}`}>
      {[theme.tokens.primary, theme.tokens.accent, theme.tokens.background].map(color => <span key={color} className="size-8 rounded-full border border-black/10" style={{ backgroundColor: color }}/>) }
      <span className="ml-1 text-xs font-bold uppercase text-slate-500">{theme.mode === 'dark' ? 'Escuro' : 'Claro'}{selected === profile.themeId ? ' · Em uso' : ''}</span>
    </div>
  </section>;
}
