from pathlib import Path
import re

p = Path('src/features/admin/components/AdminAccountsTab.test.tsx')
text = p.read_text()
text = text.replace(
    "import { useApp } from '../../../store/useApp';",
    "import { useCurrentUser, useDeleteUserAccount, useUpdateUserRole, useUsers } from '../../../store/useApp';",
    1,
)
text = text.replace(
    "vi.mock('../../../store/useApp', () => ({ useApp: vi.fn() }));",
    "vi.mock('../../../store/useApp', () => ({\n"
    "  useUsers: vi.fn(),\n"
    "  useCurrentUser: vi.fn(),\n"
    "  useUpdateUserRole: vi.fn(),\n"
    "  useDeleteUserAccount: vi.fn(),\n"
    "}));",
    1,
)
pattern = re.compile(r"  vi\.mocked\(useApp\)\.mockReturnValue\(\{.*?\n  \} as unknown as ReturnType<typeof useApp>\);", re.S)
replacement = '''  vi.mocked(useCurrentUser).mockReturnValue({ id: 'owner', name: 'Proprietário', role: 'owner' });
  vi.mocked(useUsers).mockReturnValue([
    { id: 'owner', name: 'Proprietário', email: 'owner@example.test', role: 'owner' },
    { id: 'customer', name: 'Cliente Teste', email: 'customer@example.test', role: 'customer' },
    { id: 'professional', name: 'Profissional Teste', email: 'staff@example.test', role: 'professional', profileId: 'agenda-1' },
  ]);
  vi.mocked(useUpdateUserRole).mockReturnValue(updateUserRole);
  vi.mocked(useDeleteUserAccount).mockReturnValue(deleteUserAccount);'''
text, count = pattern.subn(replacement, text, count=1)
if count != 1:
    raise SystemExit(f'AdminAccountsTab test mock block: expected one match, got {count}')
p.write_text(text)
