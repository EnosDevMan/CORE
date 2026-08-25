import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminAccountsTab } from './AdminAccountsTab';
import { useApp } from '../../../store/useApp';

vi.mock('../../../store/useApp', () => ({ useApp: vi.fn() }));

const updateUserRole = vi.fn();
const deleteUserAccount = vi.fn();
const showFeedback = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  updateUserRole.mockResolvedValue(undefined);
  deleteUserAccount.mockResolvedValue(undefined);
  vi.mocked(useApp).mockReturnValue({
    currentUser: { id: 'owner', name: 'Proprietário', role: 'owner' },
    users: [
      { id: 'owner', name: 'Proprietário', email: 'owner@example.test', role: 'owner' },
      { id: 'customer', name: 'Cliente Teste', email: 'customer@example.test', role: 'customer' },
      { id: 'professional', name: 'Profissional Teste', email: 'staff@example.test', role: 'professional', profileId: 'agenda-1' },
    ],
    updateUserRole,
    deleteUserAccount,
  } as unknown as ReturnType<typeof useApp>);
});

afterEach(() => vi.restoreAllMocks());

describe('owner account management', () => {
  it('protects the owner and promotes a customer only after the server confirms it', async () => {
    render(<AdminAccountsTab showFeedback={showFeedback} />);

    expect(screen.queryByText('owner@example.test')).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: 'Papel de Cliente Teste' }), {
      target: { value: 'professional' },
    });

    await waitFor(() => expect(updateUserRole).toHaveBeenCalledWith('customer', 'professional'));
    expect(showFeedback).toHaveBeenCalledWith('Conta de Cliente Teste atualizada para profissional.');
  });

  it('keeps linked professionals from being demoted while their agenda is linked', () => {
    render(<AdminAccountsTab showFeedback={showFeedback} />);

    const roleSelect = screen.getByRole('combobox', { name: 'Papel de Profissional Teste' });
    expect(roleSelect.querySelector('option[value="customer"]')).toBeDisabled();
  });

  it('requires explicit confirmation and surfaces deletion errors', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    deleteUserAccount.mockRejectedValue(new Error('Falha ao revogar sessões'));
    render(<AdminAccountsTab showFeedback={showFeedback} />);

    fireEvent.click(screen.getByRole('button', { name: 'Excluir conta de Cliente Teste' }));

    expect(confirm).toHaveBeenCalledOnce();
    await waitFor(() => expect(deleteUserAccount).toHaveBeenCalledWith('customer'));
    expect(showFeedback).toHaveBeenCalledWith('Falha ao revogar sessões', true);
  });

  it('does not delete an account when confirmation is refused', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<AdminAccountsTab showFeedback={showFeedback} />);

    fireEvent.click(screen.getByRole('button', { name: 'Excluir conta de Cliente Teste' }));

    expect(deleteUserAccount).not.toHaveBeenCalled();
  });
});
