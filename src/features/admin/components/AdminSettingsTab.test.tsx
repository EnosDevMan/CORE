import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  updateConfig: vi.fn(),
  refreshRuntime: vi.fn(),
  showFeedback: vi.fn(),
  config: {
    name: 'Nome Antigo',
    logo: '',
    address: 'Rua Teste 123',
    phone: '83996822057',
    workingHours: {
      open: '09:00',
      close: '18:00',
      daysOpen: [1, 2, 3, 4, 5, 6],
    },
    socialLinks: {},
    bookingFee: 0,
    intervalMinutes: 30,
    bookingWindowDays: 30,
    minimumNoticeMinutes: 30,
    cancellationNoticeMinutes: 0,
    pixKey: '',
    heroTitle: '',
    heroSubtitle: '',
    heroDescription: '',
    aboutText: '',
  },
}));

vi.mock('../../../store/useApp', () => ({
  useApp: () => ({ config: mocks.config, updateConfig: mocks.updateConfig }),
}));

vi.mock('../../../core/business/hooks', () => ({
  useBusiness: () => ({ refreshRuntime: mocks.refreshRuntime }),
  useNiche: () => ({ id: 'barbershop', name: 'Barbearia' }),
}));

vi.mock('./agenda/ScheduleBlockForm', () => ({
  ScheduleBlockForm: () => <div data-testid="schedule-block-form" />,
}));

import { AdminSettingsTab } from './AdminSettingsTab';

describe('AdminSettingsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateConfig.mockResolvedValue(undefined);
    mocks.refreshRuntime.mockResolvedValue(undefined);
  });

  it('refreshes the canonical public runtime after saving business identity', async () => {
    render(<AdminSettingsTab showFeedback={mocks.showFeedback} />);

    fireEvent.change(screen.getByLabelText('Nome do estabelecimento'), {
      target: { value: 'Nome Novo' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => expect(mocks.updateConfig).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Nome Novo' }),
    ));
    await waitFor(() => expect(mocks.refreshRuntime).toHaveBeenCalledOnce());

    expect(mocks.updateConfig.mock.invocationCallOrder[0])
      .toBeLessThan(mocks.refreshRuntime.mock.invocationCallOrder[0]);
    expect(mocks.showFeedback).toHaveBeenCalledWith('Configurações salvas com sucesso!', false);
  });
});
