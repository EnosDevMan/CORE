import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProfessionalSelectionStep } from './ProfessionalSelectionStep';

const professionals = [
  { id: 'p1', name: 'Alex', avatar: '', specialty: 'Especialista', active: true },
  { id: 'p2', name: 'Sam', avatar: '', specialty: '', active: true },
];

describe('ProfessionalSelectionStep', () => {
  it('exposes accessible selection buttons and the selected state', () => {
    const selectProfessional = vi.fn();
    render(<ProfessionalSelectionStep
      professionals={professionals}
      selectedProfessional={professionals[0]}
      selectProfessional={selectProfessional}
    />);

    expect(screen.getByRole('button', { name: /Alex/ })).toHaveAttribute('aria-pressed', 'true');
    const sam = screen.getByRole('button', { name: /Sam/ });
    expect(sam).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(sam);
    expect(selectProfessional).toHaveBeenCalledWith(professionals[1]);
  });
});
