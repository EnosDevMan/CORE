import type { CSSProperties } from 'react';
import type { ThemeStyleId } from '../layouts/types';
import { resolveTheme } from './registry';
import type { PaletteId } from './types';

interface AppearancePreviewProps {
  styleId: ThemeStyleId;
  paletteId: PaletteId;
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

const COMPOSITIONS: Readonly<Record<ThemeStyleId, PreviewComposition>> = {
  modern: { columns: '1.08fr .92fr', art: { borderRadius: '.7rem' } },
  premium: { columns: '.82fr 1.18fr', art: { borderRadius: '.15rem' }, frame: { borderRadius: '.3rem' } },
  minimal: { columns: '1fr', align: 'center', art: { borderRadius: '.1rem', boxShadow: 'none', width: '88%', marginInline: 'auto' }, frame: { boxShadow: 'none' } },
  heritage: { columns: '1fr 1fr', art: { borderRadius: '.08rem', clipPath: 'polygon(7% 0,100% 0,100% 92%,92% 100%,0 100%,0 7%)' }, frame: { border: '3px double currentColor', borderRadius: '.1rem' } },
  editorial: { columns: '1fr .72fr', align: 'center', art: { borderRadius: '5rem 5rem .7rem .7rem' }, cardTransforms: ['', 'translateY(.35rem)', ''] },
  showcase: { columns: '1fr 1fr', art: { borderRadius: '44% 56% 36% 64% / 48% 39% 61% 52%', transform: 'rotate(-3deg)' }, cardTransforms: ['rotate(-2deg)', '', 'rotate(2deg)'] },
  clean: { columns: '1fr 1fr', art: { borderRadius: '1.5rem', boxShadow: 'none' } },
  friendly: { columns: '1fr 1fr', art: { borderRadius: '48% 52% 45% 55% / 56% 43% 57% 44%', transform: 'rotate(2deg)' }, cardTransforms: ['rotate(-2deg)', 'rotate(2deg)', 'rotate(-2deg)'] },
};

const line = (background: string, width: string, height: string): CSSProperties => ({
  width, height, borderRadius: '999px', background,
});

/** Lightweight composition sketch. It never mounts the public application. */
export function AppearancePreview({ styleId, paletteId, compact = false, label = 'Prévia visual do site' }: AppearancePreviewProps) {
  const { tokens: t, mode } = resolveTheme(styleId, paletteId);
  const composition = COMPOSITIONS[styleId];
  const small = compact;
  const border = `1px solid ${t.cardBorder}`;
  const frame: CSSProperties = {
    overflow: 'hidden', minHeight: small ? '8.4rem' : '14rem', padding: small ? '.55rem' : '.8rem',
    border, borderRadius: t.cardRadius, background: styleId === 'minimal' ? t.background : t.heroGradient,
    color: t.foreground, fontFamily: t.fontBody, boxShadow: small ? 'none' : t.shadow, ...composition.frame,
  };
  const copyAlign = composition.align ?? 'flex-start';
  const artHeight = small ? (styleId === 'minimal' ? '2.5rem' : '3.7rem') : (styleId === 'minimal' ? '4rem' : '6.6rem');

  return (
    <div style={frame} data-preview-style={styleId} data-theme-mode={mode} role="img" aria-label={label}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem', height: '1.45rem', padding: '.25rem .4rem', borderRadius: t.buttonRadius, background: styleId === 'minimal' ? 'transparent' : t.nav, borderBottom: styleId === 'minimal' ? border : undefined }}>
        <span style={line(styleId === 'minimal' ? t.foreground : t.navForeground, '1.8rem', '.3rem')} />
        <span style={{ ...line(styleId === 'minimal' ? t.foreground : t.navForeground, '1.1rem', '.2rem'), marginLeft: 'auto', opacity: .5 }} />
        <span style={{ ...line(t.accent, '1rem', '.55rem'), borderRadius: t.buttonRadius }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: composition.columns, gap: '.55rem', alignItems: 'center', minHeight: small ? '4.5rem' : '8rem', padding: small ? '.45rem .2rem .25rem' : '.9rem .3rem .55rem' }}>
        <div style={{ display: 'flex', minWidth: 0, flexDirection: 'column', alignItems: copyAlign }}>
          <span style={{ ...line(t.primary, '2.2rem', '.22rem'), marginBottom: '.4rem' }} />
          <span style={line(t.foreground, styleId === 'minimal' ? '66%' : '88%', small ? '.48rem' : '.6rem')} />
          <span style={{ ...line(t.foreground, styleId === 'minimal' ? '45%' : '65%', small ? '.48rem' : '.6rem'), marginTop: '.2rem' }} />
          {!small && <span style={{ ...line(t.mutedForeground, '72%', '.22rem'), marginTop: '.5rem', opacity: .7 }} />}
          <span style={{ ...line(t.cta, '3rem', '.9rem'), marginTop: '.55rem', borderRadius: t.buttonRadius }} />
        </div>
        <div style={{ position: 'relative', overflow: 'hidden', height: artHeight, border, background: t.surfaceGradient, boxShadow: t.shadow, ...composition.art }}>
          <span style={{ position: 'absolute', width: small ? '2.8rem' : '4.5rem', height: small ? '2.8rem' : '4.5rem', right: '-.7rem', bottom: '-.8rem', borderRadius: '50%', background: t.decorative }} />
          <span style={{ position: 'absolute', width: small ? '1.4rem' : '2.4rem', height: small ? '1.4rem' : '2.4rem', left: '50%', top: '50%', border: `${small ? '.3rem' : '.45rem'} solid ${t.primary}`, borderRadius: '50%', transform: 'translate(-50%,-50%)', opacity: .75 }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '.35rem' }}>
        {[0, 1, 2].map(index => (
          <span key={index} style={{ height: small ? '1.15rem' : '2.3rem', border, borderRadius: styleId === 'heritage' ? '.08rem' : t.cardRadius, background: t.cardBackground, boxShadow: styleId === 'clean' || styleId === 'minimal' ? 'none' : t.shadow, transform: composition.cardTransforms?.[index] }} />
        ))}
      </div>
    </div>
  );
}
