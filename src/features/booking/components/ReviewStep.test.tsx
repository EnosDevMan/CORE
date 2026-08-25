import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ReviewStep } from './ReviewStep';
import type { BusinessConfig, Service } from '../../../types';

const service: Service = {
  id: 'service-1',
  name: 'Corte',
  duration: 30,
  price: 50,
  description: '',
  category: 'Cabelo',
  active: true,
};

const config: BusinessConfig = {
  name: 'CORE',
  logo: '',
  address: 'Rua Teste',
  phone: '(85) 99999-9999',
  workingHours: { open: '09:00', close: '18:00', daysOpen: [1] },
  socialLinks: {},
  bookingFee: 10,
  intervalMinutes: 30,
  bookingWindowDays: 30,
  minimumNoticeMinutes: 30,
  cancellationNoticeMinutes: 120,
  pixKey: 'pix@example.test',
};

const renderStep = () => {
  render(
    <ReviewStep
      currentUser={null}
      custName="Cliente"
      setCustName={vi.fn()}
      custPhone="85999999999"
      setCustPhone={vi.fn()}
      notes=""
      setNotes={vi.fn()}
      selectedProfessional={{ id: 'professional-1', name: 'Profissional', avatar: '', specialty: '', active: true }}
      selectedServices={[service]}
      selectedDate="2026-08-25"
      selectedTime="10:00"
      totalDuration={30}
      totalPrice={50}
      config={config}
    />,
  );
};

describe('ReviewStep', () => {
  it('informa taxa separada e antecedência de cancelamento antes da confirmação', () => {
    renderStep();

    expect(screen.getByText(/Taxa de reserva: R\$ 10,00/i)).toBeInTheDocument();
    expect(screen.getByText(/cobrada separadamente via PIX/i)).toBeInTheDocument();
    expect(screen.getByText(/2 horas de antecedência/i)).toBeInTheDocument();
  });

  it('abre os termos em outra aba sem desmontar o agendamento em andamento', () => {
    renderStep();
    const link = screen.getByRole('link', { name: /Termos de Uso e a Política/i });

    expect(link).toHaveAttribute('href', '#privacy');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
  });
});
