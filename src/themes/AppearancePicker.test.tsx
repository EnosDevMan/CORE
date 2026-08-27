import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ThemeStyleId } from '../layouts/types';
import type { CustomPaletteColors, PaletteSelectionId, SurfaceMode } from './types';
import { AppearancePicker } from './AppearancePicker';

function PickerHarness() {
  const [styleId, setStyleId] = useState<ThemeStyleId>('modern');
  const [paletteId, setPaletteId] = useState<PaletteSelectionId>('graphite');
  const [surfaceMode, setSurfaceMode] = useState<SurfaceMode>('dark');
  const [customColors, setCustomColors] = useState<CustomPaletteColors>();
  return (
    <AppearancePicker
      nicheId="barbershop"
      styleId={styleId}
      paletteId={paletteId}
      surfaceMode={surfaceMode}
      customColors={customColors}
      onStyleChange={setStyleId}
      onPaletteChange={setPaletteId}
      onSurfaceModeChange={setSurfaceMode}
      onCustomColorsChange={setCustomColors}
    />
  );
}

describe('AppearancePicker', () => {
  it('shows four niche-directed styles, nine curated palettes and custom colours', () => {
    render(<PickerHarness />);
    expect(screen.getAllByRole('radio', { name: /Precision|Executive|Studio|Heritage/i })).toHaveLength(4);
    expect(screen.getAllByRole('radio', { name: /graphite|navy|copper|forest|burgundy|steel|cream|minimal white|contemporary blue/i })).toHaveLength(9);
    expect(screen.getByRole('button', { name: /Personalizada/i })).toBeVisible();
  });

  it('changes colour, art direction and surface mode independently', () => {
    render(<PickerHarness />);
    const precision = screen.getByRole('radio', { name: /Precision/i });
    const copper = screen.getByRole('radio', { name: /Copper/i });
    fireEvent.click(copper);
    expect(copper).toBeChecked();
    expect(precision).toBeChecked();

    fireEvent.click(screen.getByRole('radio', { name: /Heritage/i }));
    expect(screen.getByRole('radio', { name: /Heritage/i })).toBeChecked();
    expect(copper).toBeChecked();

    fireEvent.click(screen.getByRole('radio', { name: /Claro/i }));
    expect(screen.getByRole('radio', { name: /Claro/i })).toBeChecked();
    expect(screen.getByText('Heritage + Copper + Claro')).toBeInTheDocument();
  });

  it('offers three owner brand colours without exposing low-level theme tokens', () => {
    render(<PickerHarness />);
    fireEvent.click(screen.getByRole('button', { name: /Personalizada/i }));
    expect(screen.getByLabelText('Principal: valor hexadecimal')).toHaveValue('#315f96');
    expect(screen.getByLabelText('Secundária: valor hexadecimal')).toHaveValue('#d9e7f2');
    expect(screen.getByLabelText('Destaque: valor hexadecimal')).toHaveValue('#c9975b');
    expect(screen.queryByLabelText(/cor do card/i)).not.toBeInTheDocument();
  });
});
