import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BusinessRuntimeBoundary } from './BusinessRuntimeBoundary';
import { businessService } from './businessService';
import { useBusiness } from './hooks';

vi.mock('./businessService', () => ({
  businessService: { getRuntime: vi.fn() },
}));

function RuntimeProbe() {
  const { profile } = useBusiness();
  return <span>{profile.name}</span>;
}

describe('BusinessRuntimeBoundary', () => {
  afterEach(() => vi.resetAllMocks());

  it('mantém cadastro e onboarding renderizáveis antes de existir business_profile', async () => {
    vi.mocked(businessService.getRuntime).mockResolvedValue(null);

    render(
      <BusinessRuntimeBoundary>
        <RuntimeProbe />
      </BusinessRuntimeBoundary>,
    );

    expect(await screen.findByText('CORE')).toBeInTheDocument();
  });
});
