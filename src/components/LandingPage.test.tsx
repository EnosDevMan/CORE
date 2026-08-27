import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BusinessProvider } from '../core/business/BusinessProvider';
import type { BusinessProfile } from '../core/business/types';
import { resolveTheme } from '../themes/registry';
import { LandingPage } from './LandingPage';

const store = vi.hoisted(() => ({
  config: {
    name: 'CORE Teste',
    logo: '',
    address: 'Rua Teste, 10',
    phone: '(11) 99999-9999',
    workingHours: { open: '09:00', close: '18:00', daysOpen: [1, 2, 3, 4, 5, 6] },
    socialLinks: {},
    bookingFee: 0,
    intervalMinutes: 30,
    bookingWindowDays: 30,
  },
  services: [{
    id: 'service-1', name: 'Serviço Teste', duration: 30, price: 50,
    description: 'Descrição', category: 'Principal', active: true, order: 1,
  }],
  professionals: [{
    id: 'professional-1', name: 'Profissional Teste', avatar: '', specialty: 'Especialista',
    active: true, order: 1,
  }],
}));

vi.mock('../store/useApp', () => ({
  useBusinessConfig: () => store.config,
  useServices: () => store.services,
  useProfessionals: () => store.professionals,
  useGalleryPhotos: () => [],
  useScheduleBlocks: () => [],
}));

const profiles: Array<[BusinessProfile, string]> = [
  [{ name: 'Barbearia', nicheId: 'barbershop', themeId: 'heritage_copper', themeStyleId: 'heritage', paletteId: 'copper', timezone: 'America/Sao_Paulo', currency: 'BRL', locale: 'pt-BR' }, 'heritage'],
  [{ name: 'Salão', nicheId: 'beauty_salon', themeId: 'rose_elegance', themeStyleId: 'editorial', paletteId: 'rose', timezone: 'America/Sao_Paulo', currency: 'BRL', locale: 'pt-BR' }, 'editorial'],
  [{ name: 'Nail', nicheId: 'nail_studio', themeId: 'lavender_studio', themeStyleId: 'showcase', paletteId: 'lavender', timezone: 'America/Sao_Paulo', currency: 'BRL', locale: 'pt-BR' }, 'showcase'],
  [{ name: 'Pet', nicheId: 'pet_shop', themeId: 'forest_clean', themeStyleId: 'clean', paletteId: 'forest', timezone: 'America/Sao_Paulo', currency: 'BRL', locale: 'pt-BR' }, 'clean'],
];

describe('LandingPage appearance integration', () => {
  it.each(profiles)('renders the persisted public layout for $name', (profile, layoutId) => {
    const { container } = render(
      <BusinessProvider profile={profile} theme={resolveTheme(profile.themeStyleId, profile.paletteId)}>
        <LandingPage onStartBooking={vi.fn()} onOpenLogin={vi.fn()} onOpenPrivacy={vi.fn()} />
      </BusinessProvider>,
    );

    expect(container.querySelector('.core-public-page')).toHaveAttribute('data-public-layout', layoutId);
    expect(container.querySelector('.core-theme-root')).toHaveAttribute('data-theme-style', layoutId);
    expect(container.querySelector('.core-theme-root')).toHaveAttribute('data-palette', profile.paletteId);
    expect(screen.getByRole('button', { name: /Agendar agora/i })).toBeVisible();
    expect(screen.getByText(/50,00/)).toBeInTheDocument();
  });

  it('keeps hero and service CTAs connected to the booking flow', () => {
    const onStartBooking = vi.fn();
    render(
      <BusinessProvider
        profile={profiles[0][0]}
        theme={resolveTheme(profiles[0][0].themeStyleId, profiles[0][0].paletteId)}
      >
        <LandingPage onStartBooking={onStartBooking} onOpenLogin={vi.fn()} onOpenPrivacy={vi.fn()} />
      </BusinessProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Agendar agora/i }));
    expect(onStartBooking).toHaveBeenLastCalledWith();
    fireEvent.click(screen.getByRole('button', { name: /Escolher/i }));
    expect(onStartBooking).toHaveBeenLastCalledWith({ serviceId: 'service-1' });
  });
});
