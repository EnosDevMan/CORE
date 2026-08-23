import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LoadingScreen } from './LoadingScreen';

describe('LoadingScreen', () => {
  it('uses a niche-neutral identity while loading', () => {
    render(<LoadingScreen />);

    expect(screen.getByText('Agenda do negócio')).toBeInTheDocument();
    expect(screen.getByText('Preparando sua agenda')).toBeInTheDocument();
    expect(screen.getByLabelText('Agenda')).toBeInTheDocument();
    expect(screen.queryByText(/barbearia/i)).not.toBeInTheDocument();
  });

  it('shows the recoverable error and invokes retry', () => {
    const onRetry = vi.fn();
    render(<LoadingScreen error="Falha temporária" onRetry={onRetry} />);

    screen.getByRole('button', { name: 'Tentar novamente' }).click();
    expect(screen.getByText('Falha temporária')).toBeInTheDocument();
    expect(screen.getByLabelText('Aviso')).toBeInTheDocument();
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
