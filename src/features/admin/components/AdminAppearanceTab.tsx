import { useEffect, useState } from 'react';
import { businessService } from '../../../core/business/businessService';
import { useBusiness, useNiche } from '../../../core/business/hooks';
import { THEME_REGISTRY } from '../../../themes/registry';
import type { ThemeId } from '../../../themes/types';

export function AdminAppearanceTab({ showFeedback }: { showFeedback: (msg: string, isError: boolean) => void }) {
  const niche = useNiche();
  const { profile, refreshRuntime } = useBusiness();
  const [selected, setSelected] = useState<ThemeId>(profile.themeId);
  const [saving, setSaving] = useState(false);

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
      showFeedback(error instanceof Error ? error.message : 'Não foi possível atualizar o tema do site.', true);
    } finally {
      setSaving(false);
    }
  };

  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <h3 className="font-extrabold text-slate-900">Aparência do site</h3>
    <p className="mt-1 text-sm text-slate-500">Temas selecionados para {niche.name}.</p>
    <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
      <label className="text-sm font-bold text-slate-700">Tema
        <select value={selected} onChange={event => setSelected(event.target.value as ThemeId)} style={{ borderColor: THEME_REGISTRY[selected].tokens.primary }} className="mt-2 min-h-11 w-full rounded-xl border-2 bg-white px-3 font-medium">
          {niche.recommendedThemeIds.map(id => <option key={id} value={id}>{THEME_REGISTRY[id as ThemeId].name}</option>)}
        </select>
      </label>
      <button type="button" onClick={save} disabled={saving || selected === profile.themeId} className="min-h-11 rounded-xl bg-slate-900 px-5 text-sm font-bold text-white disabled:opacity-40">{saving ? 'Aplicando...' : selected === profile.themeId ? 'Tema em uso' : 'Aplicar tema'}</button>
    </div>
  </section>;
}
