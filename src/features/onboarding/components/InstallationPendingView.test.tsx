import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { InstallationPendingView } from './InstallationPendingView';

describe('InstallationPendingView', () => {
  it('shows a neutral unpublished state without business-template content', () => {
    render(<InstallationPendingView onOpenAccess={vi.fn()} onOpenPrivacy={vi.fn()} />);

    expect(screen.getByRole('heading', { name: /ainda está sendo configurado/i })).toBeInTheDocument();
    expect(screen.getByText(/nenhuma identidade, serviço ou profissional de exemplo/i)).toBeInTheDocument();
    expect(screen.queryByText(/barbearia/i)).not.toBeInTheDocument();
  });

  it('keeps access and privacy actions available during installation', () => {
    const onOpenAccess = vi.fn();
    const onOpenPrivacy = vi.fn();
    render(<InstallationPendingView onOpenAccess={onOpenAccess} onOpenPrivacy={onOpenPrivacy} />);

    fireEvent.click(screen.getByRole('button', { name: /entrar ou criar conta/i }));
    fireEvent.click(screen.getByRole('button', { name: /política de privacidade/i }));

    expect(onOpenAccess).toHaveBeenCalledTimes(1);
    expect(onOpenPrivacy).toHaveBeenCalledTimes(1);
  });
});
