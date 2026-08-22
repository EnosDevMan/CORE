import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DateTimeSelectionStep } from './DateTimeSelectionStep';
import { BusinessProvider } from '../../../core/business/BusinessProvider';

const baseProps = {
  selectedDate: '2026-08-08',
  setSelectedDate: () => undefined,
  selectedTime: '',
  setSelectedTime: () => undefined,
  availableTimes: [] as string[],
  bookingWindowDays: 7,
};

const renderStep = (props: Partial<React.ComponentProps<typeof DateTimeSelectionStep>> = {}) =>
  render(
    <BusinessProvider profile={{
      name: 'Demo', nicheId: 'beauty_salon', themeId: 'minimal_light',
      timezone: 'America/Sao_Paulo', currency: 'BRL', locale: 'pt-BR',
    }}>
      <DateTimeSelectionStep {...baseProps} {...props} />
    </BusinessProvider>,
  );

describe('DateTimeSelectionStep', () => {
  it('diferencia uma falha de consulta de uma agenda realmente lotada', () => {
    renderStep({ slotsError: 'Falha temporária ao consultar a agenda.' });

    expect(screen.getByRole('alert')).toHaveTextContent('Falha temporária ao consultar a agenda.');
    expect(screen.queryByText('Nenhum horário disponível nesta data')).not.toBeInTheDocument();
  });

  it('informa indisponibilidade somente quando a consulta terminou sem erro', () => {
    renderStep();

    expect(screen.getByText('Nenhum horário disponível nesta data')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('usa e informa a janela de agendamento configurada pelo admin', () => {
    renderStep();

    expect(screen.getByText('Agendamentos disponíveis para os próximos 7 dias.')).toBeInTheDocument();
    expect(screen.getByLabelText('Data do Agendamento')).toHaveAttribute('max');
  });
});
