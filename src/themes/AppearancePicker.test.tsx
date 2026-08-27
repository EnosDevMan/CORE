import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ThemeStyleId } from '../layouts/types';
import type { PaletteId } from './types';
import { AppearancePicker } from './AppearancePicker';

function PickerHarness() {
  const [styleId, setStyleId] = useState<ThemeStyleId>('modern');
  const [paletteId, setPaletteId] = useState<PaletteId>('graphite');
  return (
    <AppearancePicker
      nicheId="barbershop"
      styleId={styleId}
      paletteId={paletteId}
      onStyleChange={setStyleId}
      onPaletteChange={setPaletteId}
    />
  );
}

describe('AppearancePicker', () => {
  it('shows four structural previews and nine compact palettes', () => {
    render(<PickerHarness />);
    expect(screen.getAllByRole('radio', { name: /estilo/i })).toHaveLength(4);
    expect(screen.getAllByRole('radio', { name: /graphite|navy|copper|forest|burgundy|steel|cream|minimal white|contemporary blue/i })).toHaveLength(9);
  });

  it('changes palette without changing style and style without changing palette', () => {
    render(<PickerHarness />);
    const modern = screen.getByRole('radio', { name: /Moderno/i });
    const copper = screen.getByRole('radio', { name: /Copper/i });
    fireEvent.click(copper);
    expect(copper).toBeChecked();
    expect(modern).toBeChecked();

    fireEvent.click(screen.getByRole('radio', { name: /Heritage/i }));
    expect(screen.getByRole('radio', { name: /Heritage/i })).toBeChecked();
    expect(copper).toBeChecked();
    expect(screen.getByText('Heritage + Copper')).toBeInTheDocument();
  });
});
