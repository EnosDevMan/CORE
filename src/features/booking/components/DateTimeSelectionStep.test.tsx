import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DateTimeSelectionStep } from './DateTimeSelectionStep';

const baseProps = {
  selectedDate: '2026-08-08',
  setSelectedDate: () => undefined,
  selectedTime: '',
  setSelectedTime: () => undefined,
  availableTimes: [] as string[],
  bookingWindowDays: 7,
};

describe('DateTimeSelectionStep', () => {
  it('diferencia uma falha de consulta de uma agenda realmente lotada', () => {
    render(
      <DateTimeSelectionStep
        {...baseProps}
        slotsError="Falha temporária ao consultar a agenda."
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Falha temporária ao consultar a agenda.');
    expect(screen.queryByText('Nenhum horário disponível nesta data')).not.toBeInTheDocument();
  });

  it('informa indisponibilidade somente quando a consulta terminou sem erro', () => {
    render(<DateTimeSelectionStep {...baseProps} />);

    expect(screen.getByText('Nenhum horário disponível nesta data')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('usa e informa a janela de agendamento configurada pelo admin', () => {
    render(<DateTimeSelectionStep {...baseProps} />);

    expect(screen.getByText('Agendamentos disponíveis para os próximos 7 dias.')).toBeInTheDocument();
    expect(screen.getByLabelText('Data do Agendamento')).toHaveAttribute('max');
  });
});
