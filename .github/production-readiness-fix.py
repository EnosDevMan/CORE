from pathlib import Path
import re

# Shared paging helper used by bootstrap and on-demand admin reads.
Path('src/services/pagedQuery.ts').write_text("""export const PAGE_SIZE = 1000;

type PageResult<T> = { data: T[] | null; error: { message: string } | null };

export async function loadPagedRows<T>(loadPage: (from: number, to: number) => PromiseLike<PageResult<T>>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const result = await loadPage(from, from + PAGE_SIZE - 1);
    if (result.error) throw new Error(result.error.message);
    const page = result.data || [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}
""")

# Bootstrap was copied from the validated PR36 branch. Deduplicate its paging loops.
p = Path('src/services/bootstrapDataService.ts')
text = p.read_text()
text = text.replace("import { isAdministratorRole, isProfessionalRole, parseUserRole } from '../auth/authorization';", "import { isAdministratorRole, isProfessionalRole, parseUserRole } from '../auth/authorization';\nimport { loadPagedRows } from './pagedQuery';")
text = text.replace('const PAGE_SIZE = 1000;\n', '')
old = """  const rows: BookingRow[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const result = await supabase
      .from('bookings')
      .select(BOOKING_COLUMNS)
      .order('date', { ascending: false })
      .order('time', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    throwIfError(result.error);
    rows.push(...((result.data || []) as unknown as BookingRow[]));
    if ((result.data?.length ?? 0) < PAGE_SIZE) return rows;
  }
"""
new = """  return loadPagedRows<BookingRow>((from, to) => supabase
    .from('bookings')
    .select(BOOKING_COLUMNS)
    .order('date', { ascending: false })
    .order('time', { ascending: false })
    .order('id', { ascending: false })
    .range(from, to) as unknown as PromiseLike<{ data: BookingRow[] | null; error: { message: string } | null }>);
"""
if old not in text: raise SystemExit('booking pagination block not found')
text = text.replace(old, new)
old = """  const rows: ProfileRow[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const result = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    throwIfError(result.error);
    rows.push(...((result.data || []) as unknown as ProfileRow[]));
    if ((result.data?.length ?? 0) < PAGE_SIZE) return rows;
  }
"""
new = """  return loadPagedRows<ProfileRow>((from, to) => supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(from, to) as unknown as PromiseLike<{ data: ProfileRow[] | null; error: { message: string } | null }>);
"""
if old not in text: raise SystemExit('profile pagination block not found')
text = text.replace(old, new)
p.write_text(text)

# On-demand administrative reads. Every potentially large collection is paged.
Path('src/services/adminHistoryService.ts').write_text("""import { supabase } from '../lib/supabaseClient';
import type { Booking, BookingServiceItem } from '../types';
import { mapBooking as mapBaseBooking } from './bootstrapDataService';
import { loadPagedRows } from './pagedQuery';

type BookingRow = {
  id: string; customer_id?: string; customer_name: string; customer_phone: string;
  barber_id: string; service_id: string; date: string; time: string; status: Booking['status'];
  notes?: string; fee_paid: boolean; customer_confirmed?: boolean; value: number | string;
  created_at: string; starts_at?: string; ends_at?: string; duration_minutes?: number;
  service_items?: BookingServiceItem[] | null;
};

type SummaryRow = { customer_id: string; booking_count: number | string; total_spent: number | string; last_booking_date?: string | null };
export interface ClientHistorySummary { customerId: string; count: number; totalSpent: number; lastDate: string }

const BOOKING_COLUMNS = 'id,customer_id,customer_name,customer_phone,barber_id,service_id,date,time,status,notes,fee_paid,customer_confirmed,value,created_at,starts_at,ends_at,duration_minutes';
const mapBooking = (row: BookingRow): Booking => ({ ...mapBaseBooking(row), serviceItems: row.service_items?.length ? row.service_items : undefined });

export const adminHistoryService = {
  async loadBookingsRange(start: string, end: string): Promise<Booking[]> {
    const rows = await loadPagedRows<BookingRow>((from, to) => supabase.from('bookings')
      .select(BOOKING_COLUMNS).gte('date', start).lte('date', end)
      .order('date').order('time').order('id').range(from, to)
      as unknown as PromiseLike<{ data: BookingRow[] | null; error: { message: string } | null }>);
    return rows.map(mapBooking);
  },
  async loadReportBookings(start: string, end: string): Promise<Booking[]> {
    const rows = await loadPagedRows<BookingRow>((from, to) => supabase.rpc('get_admin_report_bookings', { p_start: start, p_end: end }).range(from, to)
      as unknown as PromiseLike<{ data: BookingRow[] | null; error: { message: string } | null }>);
    return rows.map(mapBooking);
  },
  async loadClientHistorySummaries(): Promise<ClientHistorySummary[]> {
    const rows = await loadPagedRows<SummaryRow>((from, to) => supabase.rpc('get_admin_client_history_summaries').range(from, to)
      as unknown as PromiseLike<{ data: SummaryRow[] | null; error: { message: string } | null }>);
    return rows.map(row => ({ customerId: row.customer_id, count: Number(row.booking_count), totalSpent: Number(row.total_spent), lastDate: row.last_booking_date ?? '' }));
  },
};
""")

# Reports use the business-day rollover hook and allow an explicit retry.
p = Path('src/features/admin/hooks/useAdminReports.ts')
text = p.read_text()
text = text.replace("import { getBusinessTodayStr } from '../../../utils/validation';\n", "import { useBusinessToday } from '../../../hooks/useBusinessToday';\n")
text = text.replace("  const [customEndDate, setCustomEndDate] = useState('');\n\n  const todayStr = useMemo(() => getBusinessTodayStr(profile.timezone), [profile.timezone]);", "  const [customEndDate, setCustomEndDate] = useState('');\n  const [reloadToken, setReloadToken] = useState(0);\n\n  const todayStr = useBusinessToday(profile.timezone);")
text = text.replace("  }, [rangeEnd, rangeStart]);", "  }, [rangeEnd, rangeStart, reloadToken]);")
text = text.replace("    loadError,\n  };", "    loadError,\n    retry: () => setReloadToken(value => value + 1),\n  };")
p.write_text(text)

p = Path('src/features/admin/components/AdminReportsTab.tsx')
text = p.read_text()
text = text.replace("    loadError,\n  } = useAdminReports();", "    loadError,\n    retry,\n  } = useAdminReports();")
text = text.replace('{loadError && <div className="text-sm text-slate-500">{loadError}</div>}', '{loadError && <div className="text-sm text-rose-700">{loadError} <button type="button" className="font-bold underline" onClick={retry}>Tentar novamente</button></div>}')
p.write_text(text)

# Agenda follows business-day rollover, pages the selected range and distinguishes request errors.
p = Path('src/features/admin/components/AdminAgendaTab.tsx')
text = p.read_text()
text = text.replace("import { getBusinessTodayStr } from '../../../utils/validation';", "import { useBusinessToday } from '../../../hooks/useBusinessToday';")
text = text.replace("  const [bookingsError, setBookingsError] = useState('');", "  const [bookingsError, setBookingsError] = useState('');\n  const [reloadToken, setReloadToken] = useState(0);")
text = text.replace("  const [dateFilter, setDateFilter] = useState(() => getBusinessTodayStr(profile.timezone));", "  const todayStr = useBusinessToday(profile.timezone);\n  const [dateFilter, setDateFilter] = useState(todayStr);\n  useEffect(() => setDateFilter(todayStr), [todayStr]);")
text = text.replace("  }, [rangeEnd, rangeStart]);", "  }, [rangeEnd, rangeStart, reloadToken]);")
text = text.replace('<div className="p-6 text-sm text-slate-500">{bookingsError}</div>', '<div className="p-6 text-sm text-rose-700">{bookingsError} <button type="button" className="font-bold underline" onClick={() => setReloadToken(value => value + 1)}>Tentar novamente</button></div>')
p.write_text(text)

# Client history is aggregated server-side; add loading/error/retry instead of showing zeros on failure.
p = Path('src/features/admin/components/AdminClientsTab.tsx')
text = p.read_text()
text = text.replace("  const [historyError, setHistoryError] = useState('');", "  const [historyError, setHistoryError] = useState('');\n  const [historyLoading, setHistoryLoading] = useState(true);\n  const [historyAttempt, setHistoryAttempt] = useState(0);")
text = text.replace("    void adminHistoryService.loadClientHistorySummaries()", "    setHistoryLoading(true);\n    setHistoryError('');\n    void adminHistoryService.loadClientHistorySummaries()")
text = text.replace("      .catch(error => { if (active) setHistoryError(error instanceof Error ? error.message : 'Não foi possível carregar o histórico dos clientes.'); });\n    return () => { active = false; };\n  }, []);", "      .catch(error => { if (active) setHistoryError(error instanceof Error ? error.message : 'Não foi possível carregar o histórico dos clientes.'); })\n      .finally(() => { if (active) setHistoryLoading(false); });\n    return () => { active = false; };\n  }, [historyAttempt]);")
text = text.replace("      {historyError && <div className=\"text-sm text-slate-500\">{historyError}</div>}", "      {historyLoading && <div className=\"text-sm text-slate-500\">Carregando histórico dos clientes...</div>}\n      {historyError && <div className=\"text-sm text-rose-700\">{historyError} <button type=\"button\" className=\"font-bold underline\" onClick={() => setHistoryAttempt(value => value + 1)}>Tentar novamente</button></div>}")
p.write_text(text)

# Store mutations must also work for bookings loaded only by the on-demand Agenda.
p = Path('src/store/dataStore.ts')
text = p.read_text()
text = text.replace("updateBookingStatus: (id: string, status: BookingStatus) => Promise<void>;", "updateBookingStatus: (id: string, status: BookingStatus, sourceBooking?: Booking) => Promise<void>;")
text = text.replace("rescheduleBooking: (id: string, date: string, time: string) => Promise<void>;", "rescheduleBooking: (id: string, date: string, time: string, sourceBooking?: Booking) => Promise<void>;")
text = text.replace("  updateBookingStatus: async (id, status) => {\n    const booking = get().bookings.find(b => b.id === id);", "  updateBookingStatus: async (id, status, sourceBooking) => {\n    const booking = get().bookings.find(b => b.id === id) ?? sourceBooking;")
text = text.replace("  rescheduleBooking: async (id, date, time) => {\n    const booking = get().bookings.find(b => b.id === id);", "  rescheduleBooking: async (id, date, time, sourceBooking) => {\n    const booking = get().bookings.find(b => b.id === id) ?? sourceBooking;")
text = text.replace("if (mutation.isLatest()) set(state => ({ bookings: state.bookings.map(b => (b.id === id ? updated : b)) }));", "if (mutation.isLatest()) set(state => ({ bookings: [...state.bookings.filter(b => b.id !== id), updated] }));")
p.write_text(text)

# Availability for administrative creation must query server intervals for the selected date.
p = Path('src/store/appStore.ts')
text = p.read_text()
text = text.replace("const getAvailableSlots = useCallback(async (professionalId: string, serviceId: string, date: string, excludeBookingId?: string, durationSnapshot?: number): Promise<string[]> => {", "const getAvailableSlots = useCallback(async (professionalId: string, serviceId: string, date: string, excludeBookingId?: string, durationSnapshot?: number, includeElapsed = false): Promise<string[]> => {")
text = text.replace("const slots = getAvailabilitySlots(professionalId, serviceId, date, false, excludeBookingId, occupiedIntervals, durationSnapshot);", "const slots = getAvailabilitySlots(professionalId, serviceId, date, includeElapsed, excludeBookingId, occupiedIntervals, durationSnapshot);")
p.write_text(text)

# Administrative booking form: server-backed availability with explicit error/retry.
p = Path('src/features/admin/components/agenda/AdminBookingForm.tsx')
text = p.read_text()
text = text.replace("import React, { useMemo, useState } from 'react';", "import React, { useEffect, useState } from 'react';")
text = text.replace("  const { professionals, services, isSlotAvailable, getAvailabilitySlots, addAdministrativeBooking } = useApp();", "  const { professionals, services, getAvailableSlots, addAdministrativeBooking } = useApp();")
old = """  const selectedService = services.find(service => service.id === adminServiceId);
  const slots = useMemo(() => adminProfessionalId && adminServiceId && adminDate
    ? getAvailabilitySlots(adminProfessionalId, adminServiceId, adminDate, true)
    : [], [adminProfessionalId, adminServiceId, adminDate, getAvailabilitySlots]);
"""
new = """  const selectedService = services.find(service => service.id === adminServiceId);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsError, setSlotsError] = useState('');
  const [slotsAttempt, setSlotsAttempt] = useState(0);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (!adminProfessionalId || !adminServiceId || !adminDate) { setSlots([]); setSlotsError(''); return; }
    let active = true;
    setLoadingSlots(true); setSlotsError('');
    void getAvailableSlots(adminProfessionalId, adminServiceId, adminDate, undefined, undefined, true)
      .then(values => { if (active) setSlots(values); })
      .catch(error => { if (active) { setSlots([]); setSlotsError(getErrorMessage(error, 'Não foi possível consultar os horários.')); } })
      .finally(() => { if (active) setLoadingSlots(false); });
    return () => { active = false; };
  }, [adminProfessionalId, adminServiceId, adminDate, getAvailableSlots, slotsAttempt]);
"""
if old not in text: raise SystemExit('AdminBookingForm slots block not found')
text = text.replace(old, new)
text = re.sub(r"\n    const duration = adminServiceId\.split\(','\).*?\n    if \(!isAvailable\) \{\n      showFeedback\('Erro: Este horário não está mais disponível ou conflita com outro agendamento/bloqueio\.', true\);\n      return;\n    \}\n", "\n    if (!slots.includes(adminTime)) {\n      showFeedback('Erro: Este horário não está mais disponível. Consulte os horários novamente.', true);\n      return;\n    }\n", text, flags=re.S)
old = """        {adminDate && slots.length === 0 && <div className="rounded-lg bg-slate-50 p-3 text-slate-500">Estabelecimento ou profissional fechado nesta data.</div>}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {slots.map(slot => <button key={slot.time} type="button" disabled={slot.status !== 'available'} title={slot.reason} onClick={() => setAdminTime(slot.time)} className={`rounded-lg border px-2 py-2 font-bold transition-colors ${adminTime === slot.time ? 'bg-indigo-600 text-white border-indigo-600' : slot.status === 'available' ? 'bg-white text-slate-800 border-slate-200 hover:border-indigo-500' : 'bg-slate-100 text-slate-400 border-slate-100 line-through cursor-not-allowed'}`}>
            {slot.time}<span className="block text-[9px] no-underline">{slot.status === 'available' ? 'Livre' : slot.reason}</span>
          </button>)}
        </div>"""
new = """        {slotsError ? <div className="rounded-lg bg-rose-50 p-3 text-rose-700">{slotsError} <button type="button" className="font-bold underline" onClick={() => setSlotsAttempt(value => value + 1)}>Tentar novamente</button></div> : loadingSlots ? <div className="rounded-lg bg-slate-50 p-3 text-slate-500">Consultando horários...</div> : adminDate && slots.length === 0 ? <div className="rounded-lg bg-slate-50 p-3 text-slate-500">Não há horários disponíveis nesta data.</div> : null}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {slots.map(slot => <button key={slot} type="button" onClick={() => setAdminTime(slot)} className={`rounded-lg border px-2 py-2 font-bold transition-colors ${adminTime === slot ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-500'}`}>
            {slot}<span className="block text-[9px]">Livre</span>
          </button>)}
        </div>"""
if old not in text: raise SystemExit('AdminBookingForm UI block not found')
text = text.replace(old, new)
p.write_text(text)

# Rescheduling already uses server availability; preserve backend errors and allow retry.
p = Path('src/features/admin/components/agenda/AdminRescheduleDialog.tsx')
text = p.read_text()
text = text.replace("  const [loadingSlots, setLoadingSlots] = useState(false);", "  const [loadingSlots, setLoadingSlots] = useState(false);\n  const [slotsError, setSlotsError] = useState('');\n  const [slotsAttempt, setSlotsAttempt] = useState(0);")
text = text.replace("    setLoadingSlots(true);\n    void getAvailableSlots", "    setLoadingSlots(true); setSlotsError('');\n    void getAvailableSlots")
text = text.replace("      .catch(() => { if (active) setSlots([]); })", "      .catch(error => { if (active) { setSlots([]); setSlotsError(getErrorMessage(error, 'Não foi possível consultar os horários.')); } })")
text = text.replace("date, getAvailableSlots]);", "date, getAvailableSlots, slotsAttempt]);")
text = text.replace("{loadingSlots ? <p className=\"text-sm text-slate-500 bg-slate-50 rounded-xl p-4 mb-5\">Consultando horários...</p> : slots.length === 0 && <p className=\"text-sm text-slate-500 bg-slate-50 rounded-xl p-4 mb-5\">Não há horários disponíveis nesta data.</p>}", "{loadingSlots ? <p className=\"text-sm text-slate-500 bg-slate-50 rounded-xl p-4 mb-5\">Consultando horários...</p> : slotsError ? <p className=\"text-sm text-rose-700 bg-rose-50 rounded-xl p-4 mb-5\">{slotsError} <button type=\"button\" className=\"font-bold underline\" onClick={() => setSlotsAttempt(value => value + 1)}>Tentar novamente</button></p> : slots.length === 0 && <p className=\"text-sm text-slate-500 bg-slate-50 rounded-xl p-4 mb-5\">Não há horários disponíveis nesta data.</p>}")
p.write_text(text)

# Existing tests now wait for the asynchronous server-backed slot query.
p = Path('src/features/admin/components/agenda/AdminBookingForm.test.tsx')
text = p.read_text()
text = text.replace("      isSlotAvailable: vi.fn(() => true),\n      getAvailabilitySlots: vi.fn(() => [{ time: '10:00', status: 'available' }]),", "      getAvailableSlots: vi.fn().mockResolvedValue(['10:00']),")
text = text.replace("    fireEvent.click(screen.getByRole('button', { name: /10:00/i }));", "    fireEvent.click(await screen.findByRole('button', { name: /10:00/i }));")
p.write_text(text)

# Pure pagination regression: exactly 1000 rows must request the next page.
Path('src/services/pagedQuery.test.ts').write_text("""import { describe, expect, it, vi } from 'vitest';
import { loadPagedRows } from './pagedQuery';

describe('loadPagedRows', () => {
  it('continua após uma página cheia e retorna todos os registros', async () => {
    const first = Array.from({ length: 1000 }, (_, id) => id);
    const load = vi.fn(async (from: number) => ({ data: from === 0 ? first : [1000], error: null }));
    const rows = await loadPagedRows(load);
    expect(rows).toHaveLength(1001);
    expect(load).toHaveBeenCalledTimes(2);
  });
});
""")
