import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminBookingForm } from './AdminBookingForm';
import { useApp } from '../../../../store/useApp';

vi.mock('../../../../store/useApp', () => ({ useApp: vi.fn() }));

const addBooking = vi.fn();

describe('AdminBookingForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useApp).mockReturnValue({
      barbers: [{ id: 'barber-1', name: 'Paulo', active: true }],
      services: [{ id: 'service-1', name: 'Corte', duration: 30, price: 40 }],
      isSlotAvailable: vi.fn(() => true),
      addBooking,
    } as unknown as ReturnType<typeof useApp>);
  });

  it('exibe sucesso somente depois que a persistência é confirmada', async () => {
    let confirmSave!: () => void;
    addBooking.mockReturnValue(new Promise<void>(resolve => { confirmSave = resolve; }));
    const showFeedback = vi.fn();
    const onSuccess = vi.fn();

    render(<AdminBookingForm showFeedback={showFeedback} onSuccess={onSuccess} />);
    const inputs = screen.getAllByRole('combobox');
    fireEvent.change(screen.getByPlaceholderText('Nome do Cliente *'), { target: { value: 'Cliente Manual' } });
    fireEvent.change(screen.getByPlaceholderText('WhatsApp *'), { target: { value: '11999999999' } });
    fireEvent.change(inputs[0], { target: { value: 'barber-1' } });
    fireEvent.change(inputs[1], { target: { value: 'service-1' } });
    fireEvent.change(document.querySelector('input[type="date"]')!, { target: { value: '2026-08-08' } });
    fireEvent.change(document.querySelector('input[type="time"]')!, { target: { value: '10:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(addBooking).toHaveBeenCalledOnce();
    expect(showFeedback).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();

    confirmSave();
    await waitFor(() => expect(showFeedback).toHaveBeenCalledWith('Agendamento confirmado com sucesso', false));
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it('exibe o erro da persistência e não informa sucesso', async () => {
    addBooking.mockRejectedValue(new Error('Falha no banco'));
    const showFeedback = vi.fn();
    const onSuccess = vi.fn();

    render(<AdminBookingForm showFeedback={showFeedback} onSuccess={onSuccess} />);
    const inputs = screen.getAllByRole('combobox');
    fireEvent.change(screen.getByPlaceholderText('Nome do Cliente *'), { target: { value: 'Cliente Manual' } });
    fireEvent.change(screen.getByPlaceholderText('WhatsApp *'), { target: { value: '11999999999' } });
    fireEvent.change(inputs[0], { target: { value: 'barber-1' } });
    fireEvent.change(inputs[1], { target: { value: 'service-1' } });
    fireEvent.change(document.querySelector('input[type="date"]')!, { target: { value: '2026-08-08' } });
    fireEvent.change(document.querySelector('input[type="time"]')!, { target: { value: '10:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(showFeedback).toHaveBeenCalledWith('Falha no banco', true));
    expect(onSuccess).not.toHaveBeenCalled();
    expect(screen.getByDisplayValue('Cliente Manual')).toBeInTheDocument();
  });
});
