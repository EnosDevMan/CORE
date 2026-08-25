import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BookingStatusActions } from './BookingStatusActions';
import { Booking, BookingStatus } from '../types';

const createBooking = (status: BookingStatus): Booking => ({
  id: 'booking-1',
  customerId: 'customer-1',
  customerName: 'Cliente',
  customerPhone: '11999999999',
  professionalId: 'barber-1',
  serviceId: 'service-1',
  date: '2026-08-05',
  time: '10:00',
  status,
  feePaid: false,
  value: 50,
  createdAt: '2026-08-01T10:00:00Z',
});

describe('BookingStatusActions', () => {
  it.each([
    ['Aguardando pagamento', 'Confirmar PIX', 'Confirmado'],
    ['Confirmado', 'Iniciar atendimento', 'Em atendimento'],
    ['Em atendimento', 'Concluir atendimento', 'Concluído'],
  ] as const)('oferece a próxima transição válida para %s', (current, label, next) => {
    const handleStatusChange = vi.fn();
    render(
      <BookingStatusActions
        booking={createBooking(current)}
        handleStatusChange={handleStatusChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: label }));

    expect(handleStatusChange).toHaveBeenCalledWith('booking-1', next);
    expect(screen.getByRole('button', { name: 'Faltou' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });

  it('não pula a etapa de atendimento ao avançar um agendamento confirmado', () => {
    const handleStatusChange = vi.fn();
    render(
      <BookingStatusActions
        booking={createBooking('Confirmado')}
        handleStatusChange={handleStatusChange}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Concluir atendimento' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar atendimento' }));
    expect(handleStatusChange).toHaveBeenCalledWith('booking-1', 'Em atendimento');
    expect(screen.getByRole('button', { name: 'Faltou' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });

  it('permite concluir somente depois de iniciar o atendimento', () => {
    const handleStatusChange = vi.fn();
    render(
      <BookingStatusActions
        booking={createBooking('Em atendimento')}
        handleStatusChange={handleStatusChange}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Iniciar atendimento' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Concluir atendimento' }));
    expect(handleStatusChange).toHaveBeenCalledWith('booking-1', 'Concluído');
  });

  it('bloqueia cliques concorrentes enquanto a alteração está pendente', () => {
    const handleStatusChange = vi.fn(() => new Promise<void>(() => undefined));
    render(
      <BookingStatusActions
        booking={createBooking('Confirmado')}
        handleStatusChange={handleStatusChange}
      />,
    );

    const startButton = screen.getByRole('button', { name: 'Iniciar atendimento' });
    fireEvent.click(startButton);
    fireEvent.click(startButton);

    expect(handleStatusChange).toHaveBeenCalledTimes(1);
    expect(startButton).toBeDisabled();
  });

  it('em reservas futuras não permite iniciar atendimento nem registrar ausência antecipadamente', () => {
    render(
      <BookingStatusActions
        booking={createBooking('Confirmado')}
        handleStatusChange={vi.fn()}
        context="upcoming"
      />,
    );

    expect(screen.queryByRole('button', { name: 'Iniciar atendimento' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Faltou' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });

  it('oculta a ausência antes do instante inicial mesmo na agenda do dia', () => {
    render(
      <BookingStatusActions
        booking={{ ...createBooking('Confirmado'), startsAt: '2999-01-01T10:00:00Z' }}
        handleStatusChange={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Faltou' })).not.toBeInTheDocument();
  });

  it.each(['Concluído', 'Cancelado', 'Não compareceu'] as const)(
    'não oferece ações para o status %s',
    (status) => {
      const { container } = render(
        <BookingStatusActions booking={createBooking(status)} handleStatusChange={vi.fn()} />,
      );

      expect(container).toBeEmptyDOMElement();
    },
  );
});
