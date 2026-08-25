import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { useModalAccessibility } from './useModalAccessibility';

function Fixture() {
  const [open, setOpen] = useState(false);
  const modalRef = useModalAccessibility<HTMLDivElement>(open, () => setOpen(false));
  return <>
    <button onClick={() => setOpen(true)}>Abrir</button>
    {open && <div ref={modalRef} role="dialog" tabIndex={-1}>
      <button data-modal-initial-focus>Primeiro</button>
      <button>Último</button>
    </div>}
  </>;
}

describe('useModalAccessibility', () => {
  it('traps focus, closes on Escape and restores focus to the opener', () => {
    render(<Fixture />);
    const opener = screen.getByRole('button', { name: 'Abrir' });
    opener.focus();
    fireEvent.click(opener);

    const first = screen.getByRole('button', { name: 'Primeiro' });
    const last = screen.getByRole('button', { name: 'Último' });
    expect(first).toHaveFocus();
    expect(document.body.style.overflow).toBe('hidden');

    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(first).toHaveFocus();

    first.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
    expect(document.body.style.overflow).toBe('');
  });
});
