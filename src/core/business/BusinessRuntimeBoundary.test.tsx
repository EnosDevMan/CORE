import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BusinessRuntimeBoundary } from './BusinessRuntimeBoundary';
import { businessService } from './businessService';
import { useBusiness, useNiche } from './hooks';

vi.mock('./businessService', () => ({
  businessService: { getRuntime: vi.fn() },
}));

function RuntimeProbe() {
  const { profile, configured } = useBusiness();
  const niche = useNiche();
  return <span>{`${profile.name}|${profile.nicheId}|${niche.name}|${configured}`}</span>;
}

describe('BusinessRuntimeBoundary', () => {
  afterEach(() => vi.resetAllMocks());

  it('uses a neutral, unpublished runtime before business onboarding', async () => {
    vi.mocked(businessService.getRuntime).mockResolvedValue(null);

    render(
      <BusinessRuntimeBoundary>
        <RuntimeProbe />
      </BusinessRuntimeBoundary>,
    );

    expect(await screen.findByText('CORE|core_bootstrap|CORE|false')).toBeInTheDocument();
  });

  it('marks a persisted business runtime as configured', async () => {
    vi.mocked(businessService.getRuntime).mockResolvedValue({
      profile: {
        name: 'Pet Feliz',
        timezone: 'America/Sao_Paulo',
        currency: 'BRL',
        locale: 'pt-BR',
        nicheId: 'pet_shop',
        themeId: 'minimal_light',
      },
      capabilities: ['online_booking'],
    });

    render(
      <BusinessRuntimeBoundary>
        <RuntimeProbe />
      </BusinessRuntimeBoundary>,
    );

    expect(await screen.findByText('Pet Feliz|pet_shop|Pet Shop|true')).toBeInTheDocument();
  });
});
