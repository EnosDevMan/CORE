import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  refreshRuntime: vi.fn(),
  updateAppearance: vi.fn(),
  showFeedback: vi.fn(),
  profile: {
    name: 'Barbearia Teste',
    nicheId: 'barbershop' as const,
    themeId: 'graphite_modern' as const,
    themeStyleId: 'modern' as const,
    paletteId: 'graphite' as const,
    surfaceMode: 'dark' as const,
    timezone: 'America/Sao_Paulo',
    currency: 'BRL',
    locale: 'pt-BR',
  },
}));

vi.mock('../../../core/business/hooks', () => ({
  useBusiness: () => ({ profile: mocks.profile, refreshRuntime: mocks.refreshRuntime }),
  useNiche: () => ({ id: 'barbershop', name: 'Barbearia' }),
}));

vi.mock('../../../core/business/businessService', () => ({
  businessService: {
    updateAppearance: mocks.updateAppearance,
    replaceLogo: vi.fn(),
    removeLogo: vi.fn(),
    replaceCover: vi.fn(),
    removeCover: vi.fn(),
  },
}));

import { AdminAppearanceTab } from './AdminAppearanceTab';

describe('AdminAppearanceTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateAppearance.mockResolvedValue(undefined);
    mocks.refreshRuntime.mockResolvedValue(undefined);
  });

  it('persists a palette-only change without replacing style or surface mode', async () => {
    render(<AdminAppearanceTab showFeedback={mocks.showFeedback} />);

    fireEvent.click(screen.getByRole('radio', { name: /Copper/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar aparência' }));

    await waitFor(() => expect(mocks.updateAppearance).toHaveBeenCalledWith({
      styleId: 'modern',
      paletteId: 'copper',
      surfaceMode: 'dark',
      customColors: undefined,
    }, 'barbershop'));
    expect(mocks.refreshRuntime).toHaveBeenCalledOnce();
    expect(mocks.showFeedback).toHaveBeenCalledWith('Aparência do site atualizada com sucesso!', false);
  });

  it('persists a style-only change without replacing palette or surface mode', async () => {
    render(<AdminAppearanceTab showFeedback={mocks.showFeedback} />);

    fireEvent.click(screen.getByRole('radio', { name: /Heritage/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar aparência' }));

    await waitFor(() => expect(mocks.updateAppearance).toHaveBeenCalledWith({
      styleId: 'heritage',
      paletteId: 'graphite',
      surfaceMode: 'dark',
      customColors: undefined,
    }, 'barbershop'));
  });

  it('persists a light background independently from the selected palette', async () => {
    render(<AdminAppearanceTab showFeedback={mocks.showFeedback} />);

    fireEvent.click(screen.getByRole('radio', { name: /Claro/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar aparência' }));

    await waitFor(() => expect(mocks.updateAppearance).toHaveBeenCalledWith({
      styleId: 'modern',
      paletteId: 'graphite',
      surfaceMode: 'light',
      customColors: undefined,
    }, 'barbershop'));
  });

  it('persists the three owner colours when custom palette is selected', async () => {
    render(<AdminAppearanceTab showFeedback={mocks.showFeedback} />);

    fireEvent.click(screen.getByRole('button', { name: /Personalizada/i }));
    fireEvent.change(screen.getByLabelText('Principal: valor hexadecimal'), { target: { value: '#123456' } });
    fireEvent.change(screen.getByLabelText('Secundária: valor hexadecimal'), { target: { value: '#abcdef' } });
    fireEvent.change(screen.getByLabelText('Destaque: valor hexadecimal'), { target: { value: '#fedcba' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar aparência' }));

    await waitFor(() => expect(mocks.updateAppearance).toHaveBeenCalledWith({
      styleId: 'modern',
      paletteId: 'custom',
      surfaceMode: 'dark',
      customColors: { primary: '#123456', secondary: '#abcdef', accent: '#fedcba' },
    }, 'barbershop'));
  });

  it('restores the persisted combination when Supabase rejects the update', async () => {
    mocks.updateAppearance.mockRejectedValue(new Error('Aparência indisponível.'));
    render(<AdminAppearanceTab showFeedback={mocks.showFeedback} />);

    fireEvent.click(screen.getByRole('radio', { name: /Heritage/i }));
    fireEvent.click(screen.getByRole('radio', { name: /Copper/i }));
    fireEvent.click(screen.getByRole('radio', { name: /Claro/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar aparência' }));

    await waitFor(() => expect(mocks.showFeedback).toHaveBeenCalledWith('Aparência indisponível.', true));
    expect(screen.getByRole('radio', { name: /Precision/i })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Graphite/i })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Escuro/i })).toBeChecked();
  });
});
