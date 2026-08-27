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

  it('persists a palette-only change without replacing the selected style', async () => {
    render(<AdminAppearanceTab showFeedback={mocks.showFeedback} />);

    fireEvent.click(screen.getByRole('radio', { name: /Copper/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar aparência' }));

    await waitFor(() => expect(mocks.updateAppearance).toHaveBeenCalledWith({
      styleId: 'modern',
      paletteId: 'copper',
    }, 'barbershop'));
    expect(mocks.refreshRuntime).toHaveBeenCalledOnce();
    expect(mocks.showFeedback).toHaveBeenCalledWith('Aparência do site atualizada com sucesso!', false);
  });

  it('persists a style-only change without replacing the selected palette', async () => {
    render(<AdminAppearanceTab showFeedback={mocks.showFeedback} />);

    fireEvent.click(screen.getByRole('radio', { name: /Heritage/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar aparência' }));

    await waitFor(() => expect(mocks.updateAppearance).toHaveBeenCalledWith({
      styleId: 'heritage',
      paletteId: 'graphite',
    }, 'barbershop'));
  });

  it('restores the persisted combination when Supabase rejects the update', async () => {
    mocks.updateAppearance.mockRejectedValue(new Error('Aparência indisponível.'));
    render(<AdminAppearanceTab showFeedback={mocks.showFeedback} />);

    fireEvent.click(screen.getByRole('radio', { name: /Heritage/i }));
    fireEvent.click(screen.getByRole('radio', { name: /Copper/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar aparência' }));

    await waitFor(() => expect(mocks.showFeedback).toHaveBeenCalledWith('Aparência indisponível.', true));
    expect(screen.getByRole('radio', { name: /Moderno/i })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Graphite/i })).toBeChecked();
  });
});
