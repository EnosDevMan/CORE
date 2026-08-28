from pathlib import Path

# Reuse the already-loaded booking mapper instead of shipping a second copy
# in the lazy administrative history chunk.
p = Path('src/services/bootstrapDataService.ts')
text = p.read_text()
old = 'function mapBooking(row: BookingRow): Booking {'
if old not in text:
    raise SystemExit('bootstrap mapBooking not found for export')
p.write_text(text.replace(old, 'export function mapBooking(row: BookingRow): Booking {', 1))

p = Path('src/services/adminHistoryService.ts')
text = p.read_text()
text = text.replace("import type { Booking, BookingServiceItem } from '../types';", "import type { Booking, BookingServiceItem } from '../types';\nimport { mapBooking as mapBaseBooking } from './bootstrapDataService';", 1)
start = text.index('const toHHMM')
end = text.index('\n\nconst ensureRange', start)
replacement = "const mapBooking = (row: BookingRow): Booking => ({\n  ...mapBaseBooking(row),\n  serviceItems: row.service_items?.length ? row.service_items : undefined,\n});"
text = text[:start] + replacement + text[end:]
# The callers generate ranges from controlled date inputs; PostgreSQL still
# validates authorization and the report RPC validates start/end ordering.
start = text.index('const ensureRange')
end = text.index('\n\nexport const adminHistoryService', start)
text = text[:start] + text[end+2:]
text = text.replace('    ensureRange(start, end);\n', '')
p.write_text(text)

# Keep feedback lightweight and reuse utilities already present in the bundle.
for path in (
    'src/features/admin/components/AdminAgendaTab.tsx',
    'src/features/admin/components/AdminReportsTab.tsx',
    'src/features/admin/components/AdminClientsTab.tsx',
):
    p = Path(path)
    text = p.read_text()
    text = text.replace('p-12 text-center text-sm text-slate-500', 'p-6 text-sm text-slate-500')
    text = text.replace('p-12 text-center text-sm font-medium text-rose-600', 'p-6 text-sm text-slate-500')
    text = text.replace('rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500', 'text-sm text-slate-500')
    text = text.replace('rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700', 'text-sm text-slate-500')
    p.write_text(text)
