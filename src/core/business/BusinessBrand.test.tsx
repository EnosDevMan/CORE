import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BusinessProvider } from './BusinessProvider';
import { BusinessBrand } from './BusinessBrand';

const profile = {
  name: 'Marca Teste',
  logoUrl: 'https://cdn.example/logo.webp',
  timezone: 'America/Fortaleza',
  currency: 'BRL',
  locale: 'pt-BR',
  nicheId: 'pet_shop' as const,
  themeId: 'forest_clean' as const,
};

describe('BusinessBrand', () => {
  it('renders the owner logo and keeps the business name', () => {
    const { container } = render(<BusinessProvider profile={profile}><BusinessBrand /></BusinessProvider>);
    expect(screen.getByText('Marca Teste')).toBeInTheDocument();
    expect(container.querySelector('img')).toHaveAttribute('src', profile.logoUrl);
  });

  it('falls back to the niche mark when the uploaded asset fails', () => {
    const { container } = render(<BusinessProvider profile={profile}><BusinessBrand /></BusinessProvider>);
    fireEvent.error(container.querySelector('img')!);
    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
