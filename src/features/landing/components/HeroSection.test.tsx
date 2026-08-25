import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BusinessProvider } from '../../../core/business/BusinessProvider';
import type { BusinessConfig } from '../../../types';
import { HeroSection } from './HeroSection';

const config: BusinessConfig = {
  name: 'Studio Teste',
  logo: '',
  address: '',
  phone: '',
  workingHours: { open: '09:00', close: '19:00', daysOpen: [1, 2, 3, 4, 5, 6] },
  socialLinks: {},
  bookingFee: 0,
  intervalMinutes: 30,
  bookingWindowDays: 30,
  minimumNoticeMinutes: 30,
  cancellationNoticeMinutes: 0,
};

const profile = {
  name: 'Studio Teste',
  timezone: 'America/Sao_Paulo',
  currency: 'BRL',
  locale: 'pt-BR',
  nicheId: 'nail_studio' as const,
  themeId: 'rose_elegance' as const,
};

describe('HeroSection', () => {
  it('uses the persisted niche defaults and the requested layout variant', () => {
    const { container } = render(
      <BusinessProvider profile={profile}>
        <HeroSection variant="showcase" config={config} onStartBooking={vi.fn()} onOpenLogin={vi.fn()} />
      </BusinessProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Seu estilo, em cada detalhe.' })).toBeInTheDocument();
    expect(screen.getByText(/cuidados para suas unhas/i)).toBeInTheDocument();
    expect(screen.queryByText(/cabelo e barba/i)).not.toBeInTheDocument();
    expect(container.querySelector('section')).toHaveAttribute('data-hero-variant', 'showcase');
    expect(container.querySelector('section')).toHaveClass('core-public-secondary');
  });

  it('keeps owner-configured hero copy above niche defaults', () => {
    render(
      <BusinessProvider profile={profile}>
        <HeroSection
          variant="showcase"
          config={{ ...config, heroTitle: 'Minha mensagem', heroDescription: 'Minha descrição personalizada.' }}
          onStartBooking={vi.fn()}
          onOpenLogin={vi.fn()}
        />
      </BusinessProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Minha mensagem' })).toBeInTheDocument();
    expect(screen.getByText('Minha descrição personalizada.')).toBeInTheDocument();
  });
});
