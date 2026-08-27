import { Check } from 'lucide-react';
import { THEME_STYLE_REGISTRY } from '../layouts/registry';
import type { ThemeStyleId } from '../layouts/types';
import { getNichePreset } from '../niches/registry';
import type { NicheId } from '../niches/types';
import { PALETTE_REGISTRY } from './paletteRegistry';
import type { PaletteId } from './types';
import { AppearancePreview } from './AppearancePreview';

interface AppearancePickerProps {
  nicheId: NicheId;
  styleId: ThemeStyleId;
  paletteId: PaletteId;
  onStyleChange: (styleId: ThemeStyleId) => void;
  onPaletteChange: (paletteId: PaletteId) => void;
  tone?: 'light' | 'dark';
  showCombinedPreview?: boolean;
}

export function AppearancePicker({
  nicheId,
  styleId,
  paletteId,
  onStyleChange,
  onPaletteChange,
  tone = 'light',
  showCombinedPreview = true,
}: AppearancePickerProps) {
  const niche = getNichePreset(nicheId);
  const dark = tone === 'dark';
  const unselectedBorder = dark ? 'border-slate-700 hover:border-slate-500' : 'border-slate-200 hover:border-slate-400';
  const selectedBorder = dark ? 'border-amber-400 bg-amber-400/5' : 'border-slate-900 bg-slate-50';

  return (
    <div className="space-y-7" data-appearance-picker-tone={tone}>
      <fieldset>
        <legend className={`text-sm font-extrabold ${dark ? 'text-slate-100' : 'text-slate-900'}`}>1. Estilo do site</legend>
        <p className={`mt-1 text-xs leading-5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Define composição, tipografia, imagens e ritmo das seções.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {niche.availableStyleIds.map(id => {
            const style = THEME_STYLE_REGISTRY[id];
            const selected = styleId === id;
            return (
              <label
                key={id}
                className={`cursor-pointer overflow-hidden rounded-2xl border-2 transition-colors ${selected ? selectedBorder : unselectedBorder}`}
              >
                <input
                  className="sr-only"
                  type="radio"
                  name="appearance-style"
                  value={id}
                  checked={selected}
                  onChange={() => onStyleChange(id)}
                />
                <AppearancePreview styleId={id} paletteId={paletteId} compact label={`Prévia do estilo ${style.name}`} />
                <span className="flex items-start gap-2 p-3">
                  <span className="min-w-0 flex-1">
                    <strong className={`block text-sm ${dark ? 'text-slate-100' : 'text-slate-900'}`}>{style.name}</strong>
                    <span className={`mt-1 block text-xs leading-4 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{style.description}</span>
                  </span>
                  {selected && <Check size={17} className={dark ? 'text-amber-400' : 'text-slate-900'} aria-hidden="true" />}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className={`text-sm font-extrabold ${dark ? 'text-slate-100' : 'text-slate-900'}`}>2. Cores</legend>
        <p className={`mt-1 text-xs leading-5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Troque a identidade de cor sem perder o estilo escolhido.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {niche.availablePaletteIds.map(id => {
            const palette = PALETTE_REGISTRY[id];
            const selected = paletteId === id;
            return (
              <label
                key={id}
                className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-2 px-3 py-2 transition-colors ${selected ? selectedBorder : unselectedBorder}`}
              >
                <input
                  className="sr-only"
                  type="radio"
                  name="appearance-palette"
                  value={id}
                  checked={selected}
                  onChange={() => onPaletteChange(id)}
                />
                <span className="flex -space-x-1" aria-hidden="true">
                  {palette.swatches.map((color, index) => (
                    <span key={`${color}-${index}`} className="h-5 w-5 rounded-full border border-black/15" style={{ background: color }} />
                  ))}
                </span>
                <span className={`min-w-0 flex-1 truncate text-xs font-bold ${dark ? 'text-slate-100' : 'text-slate-800'}`}>{palette.name}</span>
                {selected && <Check size={15} className={dark ? 'text-amber-400' : 'text-slate-900'} aria-hidden="true" />}
              </label>
            );
          })}
        </div>
      </fieldset>

      {showCombinedPreview && (
        <section aria-labelledby="combined-preview-title">
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <h4 id="combined-preview-title" className={`text-sm font-extrabold ${dark ? 'text-slate-100' : 'text-slate-900'}`}>Prévia combinada</h4>
              <p className={`mt-1 text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                {THEME_STYLE_REGISTRY[styleId].name} + {PALETTE_REGISTRY[paletteId].name}
              </p>
            </div>
          </div>
          <AppearancePreview styleId={styleId} paletteId={paletteId} />
        </section>
      )}
    </div>
  );
}
