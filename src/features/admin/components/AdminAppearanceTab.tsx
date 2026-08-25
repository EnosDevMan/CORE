import { useEffect, useState } from 'react';
import { Check, Palette, Save } from 'lucide-react';
import { businessService } from '../../../core/business/businessService';
import { useBusiness, useNiche } from '../../../core/business/hooks';
import { PUBLIC_LAYOUT_REGISTRY } from '../../../layouts/registry';
import { THEME_REGISTRY } from '../../../themes/registry';
import type { ThemeId } from '../../../themes/types';
import { getErrorMessage } from '../../../utils/errors';

export function AdminAppearanceTab({ showFeedback }: { showFeedback: (msg: string, isError: boolean) => void }) {
  const niche = useNiche();
  const { profile, refreshRuntime } = useBusiness();
  const [selected, setSelected] = useState<ThemeId>(profile.themeId);
  const [saving, setSaving] = useState(false);
  const themes = niche.recommendedThemeIds.map(id => THEME_REGISTRY[id as ThemeId]);
  const layout = PUBLIC_LAYOUT_REGISTRY[niche.defaultLayoutId];

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

  return <div className="space-y-6">
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-3">
        <Palette className="text-slate-700" size={22}/>
        <div><h3 className="font-extrabold text-slate-900">Aparência do site</h3><p className="text-sm text-slate-500">{niche.name} · layout {layout.name}</p></div>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600">Escolha entre identidades visuais curadas para este segmento. Conteúdo, serviços, equipe e galeria não são alterados.</p>
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {themes.map(theme => {
          const checked = theme.id === selected;
          return <label key={theme.id} className={`cursor-pointer rounded-xl border p-4 ${checked ? 'border-slate-900 ring-2 ring-slate-900/10' : 'border-slate-200'}`}>
            <input className="sr-only" type="radio" name="public-theme" checked={checked} onChange={() => setSelected(theme.id)} />
            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-1.5" aria-hidden="true">{[theme.tokens.primary, theme.tokens.accent, theme.tokens.background].map(color => <span key={color} className="size-7 rounded-full border border-black/10" style={{ backgroundColor: color }}/>)}</div>
              {checked && <Check size={18} className="text-slate-900"/>}
            </div>
            <div className="mt-3 flex items-center justify-between gap-2"><strong className="text-sm text-slate-900">{theme.name}</strong><span className="text-[10px] font-bold uppercase text-slate-500">{theme.mode === 'dark' ? 'Escuro' : 'Claro'}</span></div>
            {theme.id === profile.themeId && <span className="mt-2 inline-block text-xs font-bold text-emerald-700">Em uso</span>}
          </label>;
        })}
      </div>
      <button type="button" onClick={save} disabled={saving || selected === profile.themeId} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40"><Save size={17}/>{saving ? 'Aplicando...' : 'Aplicar tema'}</button>
    </section>
  </div>;
}
