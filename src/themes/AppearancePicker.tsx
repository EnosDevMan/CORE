import { Check, Moon, Pipette, Sun } from 'lucide-react';
import { getPublicLayoutPreset } from '../layouts/registry';
import type { ThemeStyleId } from '../layouts/types';
import { getNichePreset } from '../niches/registry';
import type { NicheId } from '../niches/types';
import { getBrandSwatches } from './paletteMode';
import { PALETTE_REGISTRY } from './paletteRegistry';
import type {
  CustomPaletteColors,
  PaletteSelectionId,
  SurfaceMode,
} from './types';
import { AppearancePreview } from './AppearancePreview';

interface AppearancePickerProps {
  nicheId: NicheId;
  styleId: ThemeStyleId;
  paletteId: PaletteSelectionId;
  surfaceMode: SurfaceMode;
  customColors?: CustomPaletteColors;
  onStyleChange: (styleId: ThemeStyleId) => void;
  onPaletteChange: (paletteId: PaletteSelectionId) => void;
  onSurfaceModeChange: (mode: SurfaceMode) => void;
  onCustomColorsChange: (colors: CustomPaletteColors) => void;
  tone?: 'light' | 'dark';
  showCombinedPreview?: boolean;
}

const DEFAULT_CUSTOM_COLORS: CustomPaletteColors = {
  primary: '#315f96',
  secondary: '#d9e7f2',
  accent: '#c9975b',
};

const swatchStyle = (color: string) => ({
  background: color,
  border: '1px solid rgb(0 0 0 / .15)',
});

export function AppearancePicker({
  nicheId,
  styleId,
  paletteId,
  surfaceMode,
  customColors,
  onStyleChange,
  onPaletteChange,
  onSurfaceModeChange,
  onCustomColorsChange,
  tone = 'light',
  showCombinedPreview = true,
}: AppearancePickerProps) {
  const niche = getNichePreset(nicheId);
  const dark = tone === 'dark';
  const unselectedBorder = dark ? 'border-slate-700 hover:border-slate-500' : 'border-slate-200 hover:border-slate-400';
  const selectedBorder = dark ? 'border-amber-400 bg-amber-400/5' : 'border-slate-900 bg-slate-50';
  const custom = customColors ?? DEFAULT_CUSTOM_COLORS;

  const chooseCustom = () => {
    if (!customColors) onCustomColorsChange(DEFAULT_CUSTOM_COLORS);
    onPaletteChange('custom');
  };

  const updateCustomColor = (key: keyof CustomPaletteColors, value: string) => {
    onCustomColorsChange({ ...custom, [key]: value });
  };

  return (
    <div className="space-y-7" data-appearance-picker-tone={tone}>
      <fieldset>
        <legend className={`text-sm font-extrabold ${dark ? 'text-slate-100' : 'text-slate-900'}`}>1. Estilo do site</legend>
        <p className={`mt-1 text-xs leading-5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Muda o desenho do site: hero, ritmo, imagens, cards e hierarquia. As opções são dirigidas para {niche.name}.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {niche.availableStyleIds.map(id => {
            const style = getPublicLayoutPreset(id, nicheId);
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
                <AppearancePreview nicheId={nicheId} styleId={id} paletteId={paletteId} surfaceMode={surfaceMode} customColors={customColors} compact label={`Prévia do estilo ${style.name}`} />
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
        <legend className={`text-sm font-extrabold ${dark ? 'text-slate-100' : 'text-slate-900'}`}>2. Cores da marca</legend>
        <p className={`mt-1 text-xs leading-5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Escolha uma família pronta ou informe as três cores da identidade do estabelecimento. O CORE gera automaticamente fundos, textos, bordas e contraste.</p>
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
                  {getBrandSwatches(id).map((color, index) => (
                    <span key={`${color}-${index}`} className="h-5 w-5 rounded-full" style={swatchStyle(color)} />
                  ))}
                </span>
                <span className={`min-w-0 flex-1 truncate text-xs font-bold ${dark ? 'text-slate-100' : 'text-slate-800'}`}>{palette.name}</span>
                {selected && <Check size={15} className={dark ? 'text-amber-400' : 'text-slate-900'} aria-hidden="true" />}
              </label>
            );
          })}
          <button
            type="button"
            onClick={chooseCustom}
            className={`flex min-h-12 items-center gap-3 rounded-xl border-2 px-3 py-2 text-left transition-colors ${paletteId === 'custom' ? selectedBorder : unselectedBorder}`}
            aria-pressed={paletteId === 'custom'}
          >
            <span className="flex -space-x-1" aria-hidden="true">
              {getBrandSwatches('custom', custom).map((color, index) => (
                <span key={`${color}-${index}`} className="h-5 w-5 rounded-full" style={swatchStyle(color)} />
              ))}
            </span>
            <span className={`min-w-0 flex-1 text-xs font-bold ${dark ? 'text-slate-100' : 'text-slate-800'}`}>Personalizada</span>
            <Pipette size={15} className={paletteId === 'custom' ? (dark ? 'text-amber-400' : 'text-slate-900') : (dark ? 'text-slate-500' : 'text-slate-400')} aria-hidden="true" />
          </button>
        </div>

        {paletteId === 'custom' && (
          <div className={`mt-4 rounded-2xl border p-4 ${dark ? 'border-slate-700' : 'border-slate-200 bg-slate-50'}`} style={dark ? { background: 'rgb(2 6 23 / .35)' } : undefined}>
            <p className={`text-xs font-bold ${dark ? 'text-slate-200' : 'text-slate-800'}`}>Paleta personalizada</p>
            <p className={`mt-1 text-xs leading-5 ${dark ? 'text-slate-500' : 'text-slate-500'}`}>Use as cores do manual da marca. O seletor aceita hexadecimal e mantém a mesma identidade nos fundos claro e escuro.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {([
                ['primary', 'Principal'],
                ['secondary', 'Secundária'],
                ['accent', 'Destaque'],
              ] as const).map(([key, label]) => (
                <label key={key} className="block">
                  <span className={`mb-1.5 block text-xs font-bold ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{label}</span>
                  <span className={`flex items-center gap-2 rounded-xl border p-2 ${dark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                    <input
                      type="color"
                      value={/^#[0-9a-f]{6}$/i.test(custom[key]) ? custom[key] : DEFAULT_CUSTOM_COLORS[key]}
                      onChange={event => updateCustomColor(key, event.target.value)}
                      className="cursor-pointer"
                      style={{ width: '2.5rem', height: '2rem', border: 0, padding: 0, background: 'transparent' }}
                      aria-label={`${label}: seletor de cor`}
                    />
                    <input
                      value={custom[key]}
                      onChange={event => updateCustomColor(key, event.target.value)}
                      maxLength={7}
                      spellCheck={false}
                      className={`min-w-0 flex-1 bg-transparent font-mono text-xs outline-none ${dark ? 'text-slate-100' : 'text-slate-800'}`}
                      aria-label={`${label}: valor hexadecimal`}
                    />
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </fieldset>

      <fieldset>
        <legend className={`text-sm font-extrabold ${dark ? 'text-slate-100' : 'text-slate-900'}`}>3. Fundo</legend>
        <p className={`mt-1 text-xs leading-5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>A mesma identidade de cor pode funcionar em ambiente claro ou escuro. O CORE ajusta automaticamente superfícies e contraste.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {([
            ['light', 'Claro', Sun],
            ['dark', 'Escuro', Moon],
          ] as const).map(([mode, label, Icon]) => {
            const selected = surfaceMode === mode;
            return (
              <label key={mode} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-2 px-3 py-2 ${selected ? selectedBorder : unselectedBorder}`}>
                <input className="sr-only" type="radio" name="appearance-surface" checked={selected} onChange={() => onSurfaceModeChange(mode)} />
                <Icon size={17} aria-hidden="true" />
                <span className={`flex-1 text-sm font-bold ${dark ? 'text-slate-100' : 'text-slate-800'}`}>{label}</span>
                {selected && <Check size={15} aria-hidden="true" />}
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
                {getPublicLayoutPreset(styleId, nicheId).name} + {paletteId === 'custom' ? 'Personalizada' : PALETTE_REGISTRY[paletteId].name} + {surfaceMode === 'light' ? 'Claro' : 'Escuro'}
              </p>
            </div>
          </div>
          <AppearancePreview nicheId={nicheId} styleId={styleId} paletteId={paletteId} surfaceMode={surfaceMode} customColors={customColors} />
        </section>
      )}
    </div>
  );
}
