import type { CSSProperties } from 'react';
import { getPublicLayoutPreset } from '../layouts/registry';
import type { HeroVariant, ThemeStyleId } from '../layouts/types';
import type { NicheId } from '../niches/types';
import { resolveTheme } from './registry';
import type { CustomPaletteColors, PaletteSelectionId, SurfaceMode } from './types';

interface AppearancePreviewProps {
  nicheId: NicheId;
  styleId: ThemeStyleId;
  paletteId: PaletteSelectionId;
  surfaceMode: SurfaceMode;
  customColors?: CustomPaletteColors;
  compact?: boolean;
  label?: string;
}

interface PreviewComposition {
  columns: string;
  align?: CSSProperties['alignItems'];
  frame?: CSSProperties;
  art: CSSProperties;
  cardTransforms?: readonly string[];
}

const FALLBACK_COMPOSITION: PreviewComposition = {
  columns: '1.08fr .92fr',
  art: { borderRadius: '.7rem' },
};

const COMPOSITIONS: Partial<Record<HeroVariant, PreviewComposition>> = {
  barber_precision: { columns: '1.05fr .95fr', art: { borderRadius: '.08rem', boxShadow: 'inset 0 .22rem 0 currentColor' } },
  barber_executive: { columns: '.9fr 1.1fr', art: { borderRadius: '0', marginLeft: '.5rem' }, frame: { borderRadius: '.08rem' } },
  barber_studio: { columns: '.72fr 1.28fr', art: { borderRadius: '0', boxShadow: 'none', height: '115%' }, frame: { boxShadow: 'none' } },
  barber_heritage: { columns: '1fr 1fr', art: { borderRadius: '0', outline: '3px double currentColor', outlineOffset: '-.3rem' }, frame: { borderRadius: '0' } },
  beauty_studio_modern: { columns: '1fr .9fr', art: { borderRadius: '2rem .5rem 2rem .5rem' } },
  beauty_soft_luxury: { columns: '1fr', align: 'center', art: { borderRadius: '4rem 4rem .45rem .45rem', width: '82%', marginInline: 'auto' }, frame: { boxShadow: 'none' } },
  beauty_signature: { columns: '1.15fr .7fr', art: { borderRadius: '0', height: '118%', boxShadow: 'none' } },
  beauty_editorial: { columns: '1fr .72fr', align: 'center', art: { borderRadius: '50% 50% .5rem .5rem / 26% 26% .5rem .5rem' }, cardTransforms: ['', 'translateY(.35rem)', ''] },
  nail_clean_studio: { columns: '1fr 1fr', art: { borderRadius: '.55rem', boxShadow: 'none' } },
  nail_boutique: { columns: '.95fr 1.05fr', art: { borderRadius: '4rem 4rem .8rem .8rem' } },
  nail_editorial: { columns: '.75fr 1.25fr', art: { borderRadius: '0', boxShadow: 'none', height: '118%' }, frame: { borderRadius: '0' } },
  nail_showcase: { columns: '1fr 1fr', art: { borderRadius: '44% 56% 36% 64% / 48% 39% 61% 52%', transform: 'rotate(-3deg)' }, cardTransforms: ['rotate(-2deg)', '', 'rotate(2deg)'] },
  pet_modern_service: { columns: '1fr 1fr', art: { borderRadius: '.75rem', boxShadow: 'none' } },
  pet_care: { columns: '1.05fr .95fr', art: { borderRadius: '1.1rem' }, frame: { boxShadow: 'none' } },
  pet_organic: { columns: '1fr 1fr', art: { borderRadius: '48% 52% 45% 55% / 56% 43% 57% 44%', boxShadow: 'none' } },
  pet_friendly: { columns: '1fr 1fr', art: { borderRadius: '48% 52% 45% 55% / 56% 43% 57% 44%', transform: 'rotate(2deg)' }, cardTransforms: ['rotate(-2deg)', 'rotate(2deg)', 'rotate(-2deg)'] },
};

const line = (background: string, width: string, height: string): CSSProperties => ({
  width, height, borderRadius: '999px', background,
});

/** Lightweight composition sketch. It never mounts the public application. */
export function AppearancePreview({
  nicheId,
  styleId,
  paletteId,
  surfaceMode,
  customColors,
  compact = false,
  label = 'Prévia visual do site',
}: AppearancePreviewProps) {
  const layout = getPublicLayoutPreset(styleId, nicheId);
  const { tokens: t, mode } = resolveTheme(styleId, paletteId, surfaceMode, customColors, nicheId);
  const composition = COMPOSITIONS[layout.heroVariant] ?? FALLBACK_COMPOSITION;
  const small = compact;
  const border = `1px solid ${t.cardBorder}`;
  const frame: CSSProperties = {
    overflow: 'hidden', minHeight: small ? '8.4rem' : '14rem', padding: small ? '.55rem' : '.8rem',
    border, borderRadius: t.cardRadius, background: t.heroGradient,
    color: t.foreground, fontFamily: t.fontBody, boxShadow: small ? 'none' : t.shadow, ...composition.frame,
  };
  const copyAlign = composition.align ?? 'flex-start';
  const artHeight = small ? '3.7rem' : '6.6rem';

  return (
    <div style={frame} data-preview-style={styleId} data-preview-art-direction={layout.heroVariant} data-theme-mode={mode} role="img" aria-label={label}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem', height: '1.45rem', padding: '.25rem .4rem', borderRadius: t.buttonRadius, background: t.nav }}>
        <span style={line(t.navForeground, '1.8rem', '.3rem')} />
        <span style={{ ...line(t.navForeground, '1.1rem', '.2rem'), marginLeft: 'auto', opacity: .5 }} />
        <span style={{ ...line(t.accent, '1rem', '.55rem'), borderRadius: t.buttonRadius }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: composition.columns, gap: '.55rem', alignItems: 'center', minHeight: small ? '4.5rem' : '8rem', padding: small ? '.45rem .2rem .25rem' : '.9rem .3rem .55rem' }}>
        <div style={{ display: 'flex', minWidth: 0, flexDirection: 'column', alignItems: copyAlign }}>
          <span style={{ ...line(t.primary, '2.2rem', '.22rem'), marginBottom: '.4rem' }} />
          <span style={line(t.foreground, '88%', small ? '.48rem' : '.6rem')} />
          <span style={{ ...line(t.foreground, '65%', small ? '.48rem' : '.6rem'), marginTop: '.2rem' }} />
          {!small && <span style={{ ...line(t.mutedForeground, '72%', '.22rem'), marginTop: '.5rem', opacity: .7 }} />}
          <span style={{ ...line(t.cta, '3rem', '.9rem'), marginTop: '.55rem', borderRadius: t.buttonRadius }} />
        </div>
        <div style={{ position: 'relative', overflow: 'hidden', height: artHeight, border, background: t.surfaceGradient, boxShadow: t.shadow, ...composition.art }}>
          <span style={{ position: 'absolute', width: small ? '2.8rem' : '4.5rem', height: small ? '2.8rem' : '4.5rem', right: '-.7rem', bottom: '-.8rem', borderRadius: '50%', background: t.secondary }} />
          <span style={{ position: 'absolute', width: small ? '1.4rem' : '2.4rem', height: small ? '1.4rem' : '2.4rem', left: '50%', top: '50%', border: `${small ? '.3rem' : '.45rem'} solid ${t.primary}`, borderRadius: '50%', transform: 'translate(-50%,-50%)', opacity: .75 }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '.35rem' }}>
        {[0, 1, 2].map(index => (
          <span key={index} style={{ height: small ? '1.15rem' : '2.3rem', border, borderRadius: t.cardRadius, background: t.cardBackground, boxShadow: t.shadow, transform: composition.cardTransforms?.[index] }} />
        ))}
      </div>
    </div>
  );
}
