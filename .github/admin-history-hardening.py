from pathlib import Path
import re


def read(path):
    return Path(path).read_text()


def write(path, text):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(text)


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 match, got {count}')
    return text.replace(old, new, 1)

# ---------------------------------------------------------------------------
# Bootstrap: owners only need today's bookings on the critical startup path.
# Full historical reads move to lazy admin screens.
# ---------------------------------------------------------------------------
p = Path('src/services/bootstrapDataService.ts')
text = p.read_text()
text = text.replace('  type BookingServiceItem,\n', '')
text = re.sub(r"type BookingServiceRow = \{.*?\n\};\n\n", '', text, count=1, flags=re.S)
text = replace_once(
    text,
    "function mapBooking(row: BookingRow, serviceItems?: BookingServiceItem[]): Booking {",
    "function mapBooking(row: BookingRow): Booking {",
    'bootstrap mapBooking signature',
)
text = replace_once(text, "    serviceItems: serviceItems?.length ? serviceItems : undefined,\n", '', 'bootstrap serviceItems mapping')
text = replace_once(
    text,
    "async function loadBookings(role?: User['role']): Promise<BookingRow[]> {\n  if (!role) return [];\n  const rows: BookingRow[] = [];",
    "async function loadBookings(role?: User['role'], adminDate?: string): Promise<BookingRow[]> {\n  if (!role) return [];\n\n  if (isAdministratorRole(role)) {\n    if (!adminDate) throw new Error('Data operacional do administrador não informada.');\n    const result = await supabase\n      .from('bookings')\n      .select(BOOKING_COLUMNS)\n      .eq('date', adminDate)\n      .order('time', { ascending: true });\n    throwIfError(result.error);\n    return (result.data || []) as unknown as BookingRow[];\n  }\n\n  const rows: BookingRow[] = [];",
    'bootstrap bounded admin bookings',
)
text = re.sub(r"async function loadServiceItems\(role\?: User\['role'\]\): Promise<BookingServiceRow\[]> \{.*?\n\}\n\n", '', text, count=1, flags=re.S)
text = replace_once(
    text,
    "  async loadAllData(role?: User['role']): Promise<{",
    "  async loadAllData(role?: User['role'], adminDate?: string): Promise<{",
    'bootstrap signature',
)
text = replace_once(text, "    const serviceItemsPromise = loadServiceItems(role);\n", '', 'bootstrap service items promise')
text = replace_once(text, "      serviceItemRows,\n", '', 'bootstrap destructure service rows')
text = replace_once(text, "      loadBookings(role),\n", "      loadBookings(role, adminDate),\n", 'bootstrap load bookings date')
text = replace_once(text, "      serviceItemsPromise,\n", '', 'bootstrap promise list')
text = re.sub(r"\n    const serviceItemsByBooking = new Map<string, BookingServiceItem\[]>\(\);.*?\n    }\n", '\n', text, count=1, flags=re.S)
text = replace_once(
    text,
    "      bookings: bookings.map(booking => mapBooking(booking, serviceItemsByBooking.get(booking.id))),",
    "      bookings: bookings.map(mapBooking),",
    'bootstrap final booking mapping',
)
p.write_text(text)

# AppDataLoader supplies the business-local date to the bounded owner bootstrap.
p = Path('src/store/AppDataLoader.tsx')
text = p.read_text()
text = replace_once(text, "import { useDataStore } from './dataStore';", "import { useDataStore } from './dataStore';\nimport { getBusinessTodayStr } from '../utils/validation';", 'loader date import')
text = replace_once(
    text,
    "        const data = await bootstrapDataService.loadAllData(currentUserRole);",
    "        const data = await bootstrapDataService.loadAllData(\n          currentUserRole,\n          getBusinessTodayStr(runtime.profile.timezone),\n        );",
    'loader bounded bootstrap call',
)
p.write_text(text)

# Allow admin lazy screens to persist a booking that is not in today's store.
p = Path('src/store/dataStore.ts')
text = p.read_text()
text = replace_once(
    text,
    "  updateBookingStatus: (id: string, status: BookingStatus) => Promise<void>;",
    "  updateBookingStatus: (id: string, status: BookingStatus, sourceBooking?: Booking) => Promise<void>;",
    'status signature',
)
text = replace_once(
    text,
    "  rescheduleBooking: (id: string, date: string, time: string) => Promise<void>;",
    "  rescheduleBooking: (id: string, date: string, time: string, sourceBooking?: Booking) => Promise<void>;",
    'reschedule signature',
)
text = replace_once(
    text,
    "  updateBookingStatus: async (id, status) => {\n    const previous = get().bookings;\n    const booking = previous.find(b => b.id === id);",
    "  updateBookingStatus: async (id, status, sourceBooking) => {\n    const previous = get().bookings;\n    const booking = previous.find(b => b.id === id) ?? sourceBooking;",
    'status source booking',
)
text = replace_once(
    text,
    "  rescheduleBooking: async (id, date, time) => {\n    const previous = get().bookings;\n    const booking = previous.find(b => b.id === id);",
    "  rescheduleBooking: async (id, date, time, sourceBooking) => {\n    const previous = get().bookings;\n    const booking = previous.find(b => b.id === id) ?? sourceBooking;",
    'reschedule source booking',
)
p.write_text(text)

# Shared lazy read service. Report RPC includes service snapshots so historical
# service revenue stays exact without downloading the whole booking_services table.
write('src/services/adminHistoryService.ts', r'''import { supabase } from '../lib/supabaseClient';
import type { Booking, BookingServiceItem } from '../types';

type BookingRow = {
  id: string;
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  barber_id: string;
  service_id: string;
  date: string;
  time: string;
  status: Booking['status'];
  notes?: string;
  fee_paid: boolean;
  customer_confirmed?: boolean;
  value: number | string;
  created_at: string;
  starts_at?: string;
  ends_at?: string;
  duration_minutes?: number;
  service_items?: BookingServiceItem[] | null;
};

export interface ClientHistorySummary {
  customerId: string;
  count: number;
  totalSpent: number;
  lastDate: string;
}

const BOOKING_COLUMNS = 'id,customer_id,customer_name,customer_phone,barber_id,service_id,date,time,status,notes,fee_paid,customer_confirmed,value,created_at,starts_at,ends_at,duration_minutes';
const toHHMM = (value: string | null | undefined) => value ? value.slice(0, 5) : value;

const mapBooking = (row: BookingRow): Booking => ({
  id: row.id,
  customerId: row.customer_id ?? 'guest',
  customerName: row.customer_name,
  customerPhone: row.customer_phone,
  professionalId: row.barber_id,
  serviceId: row.service_id,
  date: row.date,
  time: toHHMM(row.time) as string,
  status: row.status,
  notes: row.notes ?? undefined,
  feePaid: row.fee_paid,
  customerConfirmed: row.customer_confirmed ?? undefined,
  value: Number(row.value),
  createdAt: row.created_at,
  startsAt: row.starts_at ?? undefined,
  endsAt: row.ends_at ?? undefined,
  durationMinutes: row.duration_minutes ?? undefined,
  serviceItems: Array.isArray(row.service_items) && row.service_items.length ? row.service_items : undefined,
});

const ensureRange = (start: string, end: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end) || start > end) {
    throw new Error('Período de consulta inválido.');
  }
};

export const adminHistoryService = {
  async loadBookingsRange(start: string, end: string): Promise<Booking[]> {
    ensureRange(start, end);
    const { data, error } = await supabase
      .from('bookings')
      .select(BOOKING_COLUMNS)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: true })
      .order('time', { ascending: true });
    if (error) throw new Error(error.message);
    return ((data || []) as unknown as BookingRow[]).map(mapBooking);
  },

  async loadReportBookings(start: string, end: string): Promise<Booking[]> {
    ensureRange(start, end);
    const { data, error } = await supabase.rpc('get_admin_report_bookings', {
      p_start: start,
      p_end: end,
    });
    if (error) throw new Error(error.message);
    return ((data || []) as unknown as BookingRow[]).map(mapBooking);
  },

  async loadClientHistorySummaries(): Promise<ClientHistorySummary[]> {
    const { data, error } = await supabase.rpc('get_admin_client_history_summaries');
    if (error) throw new Error(error.message);
    return ((data || []) as Array<{
      customer_id: string;
      booking_count: number | string;
      total_spent: number | string;
      last_booking_date?: string | null;
    }>).map(row => ({
      customerId: row.customer_id,
      count: Number(row.booking_count),
      totalSpent: Number(row.total_spent),
      lastDate: row.last_booking_date ?? '',
    }));
  },
};
''')

# Agenda: fetch only selected range, keep mutations compatible with today's store.
p = Path('src/features/admin/components/AdminAgendaTab.tsx')
text = p.read_text()
text = replace_once(text, "import React, { useMemo, useState } from 'react';", "import React, { useEffect, useMemo, useState } from 'react';", 'agenda effect import')
text = replace_once(text, "import { useBookings, useProfessionals, useServices, useUpdateBookingStatus } from '../../../store/useApp';", "import { useProfessionals, useServices, useUpdateBookingStatus } from '../../../store/useApp';", 'agenda remove store bookings')
text = replace_once(text, "import { getErrorMessage } from '../../../utils/errors';", "import { getErrorMessage } from '../../../utils/errors';\nimport { adminHistoryService } from '../../../services/adminHistoryService';", 'agenda service import')
text = replace_once(text, "  const bookings = useBookings();\n", "  const [bookings, setBookings] = useState<Booking[]>([]);\n  const [loadingBookings, setLoadingBookings] = useState(true);\n  const [bookingsError, setBookingsError] = useState('');\n", 'agenda local state')
# replace handler to source from local booking and mirror updated status
old_handler = '''  const handleStatusChange = async (bookingId: string, newStatus: BookingStatus) => {
    if (updateBookingStatus) {
      try {
        await updateBookingStatus(bookingId, newStatus);
        const statusMessages: Record<BookingStatus, string> = {'''
new_handler = '''  const handleStatusChange = async (bookingId: string, newStatus: BookingStatus) => {
    const sourceBooking = bookings.find(item => item.id === bookingId);
    if (updateBookingStatus && sourceBooking) {
      try {
        await updateBookingStatus(bookingId, newStatus, sourceBooking);
        setBookings(current => current.map(item => item.id === bookingId
          ? { ...item, status: newStatus, feePaid: newStatus === 'Confirmado' ? true : item.feePaid }
          : item));
        const statusMessages: Record<BookingStatus, string> = {'''
text = replace_once(text, old_handler, new_handler, 'agenda status handler')
# insert range fetch after range calculation block
marker = "  }, [dateFilter, period]);\n\n  const filteredBookings = useMemo(() => bookings.filter(booking => {"
insert = "  }, [dateFilter, period]);\n\n  useEffect(() => {\n    let active = true;\n    setLoadingBookings(true);\n    setBookingsError('');\n    void adminHistoryService.loadBookingsRange(rangeStart, rangeEnd)\n      .then(rows => { if (active) setBookings(rows); })\n      .catch(error => { if (active) setBookingsError(getErrorMessage(error, 'Não foi possível carregar a agenda.')); })\n      .finally(() => { if (active) setLoadingBookings(false); });\n    return () => { active = false; };\n  }, [rangeEnd, rangeStart]);\n\n  const filteredBookings = useMemo(() => bookings.filter(booking => {"
text = replace_once(text, marker, insert, 'agenda range effect')
# show loading/error before empty state
text = replace_once(
    text,
    "            {filteredBookings.length === 0 ? (",
    "            {loadingBookings ? (\n              <div className=\"p-12 text-center text-sm text-slate-500\">Carregando agenda...</div>\n            ) : bookingsError ? (\n              <div className=\"p-12 text-center text-sm font-medium text-rose-600\">{bookingsError}</div>\n            ) : filteredBookings.length === 0 ? (",
    'agenda loading UI',
)
# reschedule callback mirrors local result
text = replace_once(
    text,
    "      {rescheduling && <AdminRescheduleDialog booking={rescheduling} onClose={() => setRescheduling(null)} showFeedback={showFeedback} />}",
    "      {rescheduling && <AdminRescheduleDialog booking={rescheduling} onClose={() => setRescheduling(null)} showFeedback={showFeedback} onRescheduled={updated => setBookings(current => current.map(item => item.id === updated.id ? updated : item))} />}",
    'agenda reschedule sync',
)
p.write_text(text)

# Reschedule dialog uses server occupied intervals, so lazy history does not weaken availability UX.
p = Path('src/features/admin/components/agenda/AdminRescheduleDialog.tsx')
text = p.read_text()
text = replace_once(text, "import React, { useMemo, useState } from 'react';", "import React, { useEffect, useState } from 'react';", 'reschedule imports')
text = replace_once(text, "  showFeedback: (message: string, isError: boolean) => void;\n}", "  showFeedback: (message: string, isError: boolean) => void;\n  onRescheduled?: (booking: Booking) => void;\n}", 'reschedule prop type')
text = replace_once(text, "export const AdminRescheduleDialog: React.FC<Props> = ({ booking, onClose, showFeedback }) => {\n  const { services, getAvailabilitySlots, rescheduleBooking } = useApp();", "export const AdminRescheduleDialog: React.FC<Props> = ({ booking, onClose, showFeedback, onRescheduled }) => {\n  const { services, getAvailableSlots, rescheduleBooking } = useApp();", 'reschedule service selection')
text = replace_once(text, "  const modalRef = useModalAccessibility<HTMLDivElement>(true, onClose);\n  const slots = useMemo(() => getAvailabilitySlots(\n    booking.professionalId, booking.serviceId, date, true, booking.id, [], booking.durationMinutes\n  ), [booking, date, getAvailabilitySlots]);", "  const modalRef = useModalAccessibility<HTMLDivElement>(true, onClose);\n  const [slots, setSlots] = useState<string[]>([]);\n  const [loadingSlots, setLoadingSlots] = useState(false);\n\n  useEffect(() => {\n    let active = true;\n    setLoadingSlots(true);\n    void getAvailableSlots(booking.professionalId, booking.serviceId, date, booking.id, booking.durationMinutes)\n      .then(values => { if (active) setSlots(values); })\n      .catch(() => { if (active) setSlots([]); })\n      .finally(() => { if (active) setLoadingSlots(false); });\n    return () => { active = false; };\n  }, [booking.durationMinutes, booking.id, booking.professionalId, booking.serviceId, date, getAvailableSlots]);", 'reschedule server slots')
text = replace_once(text, "      await rescheduleBooking(booking.id, date, time);\n      showFeedback", "      await rescheduleBooking(booking.id, date, time, booking);\n      onRescheduled?.({ ...booking, date, time });\n      showFeedback", 'reschedule source booking')
text = replace_once(text, "        {slots.map(slot => <button key={slot.time} type=\"button\" disabled={slot.status !== 'available'} onClick={() => setTime(slot.time)} className={`p-2 rounded-lg border text-xs font-bold ${time === slot.time ? 'bg-indigo-600 border-indigo-600 text-white' : slot.status === 'available' ? 'border-slate-200' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>{slot.time}</button>)}", "        {slots.map(slot => <button key={slot} type=\"button\" onClick={() => setTime(slot)} className={`p-2 rounded-lg border text-xs font-bold ${time === slot ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200'}`}>{slot}</button>)}", 'reschedule slot rendering')
text = replace_once(text, "      {slots.length === 0 && <p className=\"text-sm text-slate-500 bg-slate-50 rounded-xl p-4 mb-5\">Não há horários disponíveis nesta data.</p>}", "      {loadingSlots ? <p className=\"text-sm text-slate-500 bg-slate-50 rounded-xl p-4 mb-5\">Consultando horários...</p> : slots.length === 0 && <p className=\"text-sm text-slate-500 bg-slate-50 rounded-xl p-4 mb-5\">Não há horários disponíveis nesta data.</p>}", 'reschedule loading')
p.write_text(text)

# Reports: historical range is loaded only when the lazy reports tab is opened / changed.
p = Path('src/features/admin/hooks/useAdminReports.ts')
text = p.read_text()
text = replace_once(text, "import { useMemo, useState } from 'react';", "import { useEffect, useMemo, useState } from 'react';", 'reports effect import')
text = replace_once(text, "import { useBookings, useProfessionals, useServices } from '../../../store/useApp';", "import { useProfessionals, useServices } from '../../../store/useApp';", 'reports remove bookings selector')
text = replace_once(text, "import { buildServiceRevenueBreakdown } from '../serviceRevenue';", "import { buildServiceRevenueBreakdown } from '../serviceRevenue';\nimport { adminHistoryService } from '../../../services/adminHistoryService';\nimport type { Booking } from '../../../types';", 'reports service import')
text = replace_once(text, "  const bookings = useBookings();\n", "  const [bookings, setBookings] = useState<Booking[]>([]);\n  const [loading, setLoading] = useState(true);\n  const [loadError, setLoadError] = useState('');\n", 'reports local state')
marker = "  const bookingsInRange = useMemo(\n    () => bookings.filter(booking => booking.date >= rangeStart && booking.date <= rangeEnd),"
insert = "  useEffect(() => {\n    let active = true;\n    setLoading(true);\n    setLoadError('');\n    void adminHistoryService.loadReportBookings(rangeStart, rangeEnd)\n      .then(rows => { if (active) setBookings(rows); })\n      .catch(error => { if (active) setLoadError(error instanceof Error ? error.message : 'Não foi possível carregar o relatório.'); })\n      .finally(() => { if (active) setLoading(false); });\n    return () => { active = false; };\n  }, [rangeEnd, rangeStart]);\n\n  const bookingsInRange = useMemo(\n    () => bookings.filter(booking => booking.date >= rangeStart && booking.date <= rangeEnd),"
text = replace_once(text, marker, insert, 'reports range effect')
text = replace_once(text, "    serviceBreakdown,\n  };", "    serviceBreakdown,\n    loading,\n    loadError,\n  };", 'reports return state')
p.write_text(text)

p = Path('src/features/admin/components/AdminReportsTab.tsx')
text = p.read_text()
text = replace_once(text, "    serviceBreakdown,\n  } = useAdminReports();", "    serviceBreakdown,\n    loading,\n    loadError,\n  } = useAdminReports();", 'reports tab state')
marker = "      {/* Stats do período */}\n      <div className=\"grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6\">"
insert = "      {loading && <div className=\"rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500\">Carregando dados do período...</div>}\n      {loadError && <div className=\"rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700\">{loadError}</div>}\n\n      {/* Stats do período */}\n      <div className=\"grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6\">"
text = replace_once(text, marker, insert, 'reports loading banner')
p.write_text(text)

# Clients use compact server aggregates instead of scanning every booking in memory.
p = Path('src/features/admin/components/AdminClientsTab.tsx')
text = p.read_text()
text = replace_once(text, "import React, { useMemo, useState } from 'react';", "import React, { useEffect, useMemo, useState } from 'react';", 'clients effect import')
text = replace_once(text, "import { useBookings, useUsers } from '../../../store/useApp';", "import { useUsers } from '../../../store/useApp';", 'clients remove bookings')
text = replace_once(text, "import { useNiche } from '../../../core/business/hooks';", "import { useNiche } from '../../../core/business/hooks';\nimport { adminHistoryService } from '../../../services/adminHistoryService';", 'clients service import')
text = replace_once(text, "  const bookings = useBookings();\n", '', 'clients remove bookings state')
old = '''  const histories = useMemo(() => {
    const summaries = new Map<string, { count: number; totalSpent: number; lastDate: string }>();

    for (const booking of bookings) {
      const summary = summaries.get(booking.customerId) ?? { count: 0, totalSpent: 0, lastDate: '' };
      summary.count += 1;
      if (booking.status === 'Concluído') summary.totalSpent += booking.value;
      if (booking.date > summary.lastDate) summary.lastDate = booking.date;
      summaries.set(booking.customerId, summary);
    }

    return summaries;
  }, [bookings]);'''
new = '''  const [histories, setHistories] = useState(new Map<string, { count: number; totalSpent: number; lastDate: string }>());
  const [historyError, setHistoryError] = useState('');

  useEffect(() => {
    let active = true;
    void adminHistoryService.loadClientHistorySummaries()
      .then(rows => {
        if (!active) return;
        setHistories(new Map(rows.map(row => [row.customerId, {
          count: row.count,
          totalSpent: row.totalSpent,
          lastDate: row.lastDate,
        }])));
      })
      .catch(error => { if (active) setHistoryError(error instanceof Error ? error.message : 'Não foi possível carregar o histórico dos clientes.'); });
    return () => { active = false; };
  }, []);'''
text = replace_once(text, old, new, 'clients aggregate histories')
marker = "      {filteredClients.length === 0 ? ("
text = replace_once(text, marker, "      {historyError && <div className=\"rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700\">{historyError}</div>}\n\n      {filteredClients.length === 0 ? (", 'clients error UI')
p.write_text(text)

# SQL migration + consolidated schema.
sql = r'''-- Bound large administrative history reads to the screen/range that requested them.
-- These RPCs expose only owner-authorized aggregates/rows and keep auth checks
-- inside the database security boundary.

create or replace function public.get_admin_report_bookings(p_start date, p_end date)
returns table (
  id uuid,
  customer_id uuid,
  customer_name text,
  customer_phone text,
  barber_id uuid,
  service_id text,
  date date,
  time time,
  status public.booking_status,
  notes text,
  fee_paid boolean,
  customer_confirmed boolean,
  value numeric,
  created_at timestamptz,
  starts_at timestamptz,
  ends_at timestamptz,
  duration_minutes integer,
  service_items jsonb
)
language plpgsql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
begin
  if auth.uid() is null or public.auth_role() is distinct from 'owner' then
    raise exception using errcode = '42501', message = 'Somente o proprietário pode consultar relatórios administrativos.';
  end if;
  if p_start is null or p_end is null or p_start > p_end then
    raise exception using errcode = '22023', message = 'Período administrativo inválido.';
  end if;

  return query
  select
    booking.id, booking.customer_id, booking.customer_name, booking.customer_phone,
    booking.barber_id, booking.service_id, booking.date, booking.time, booking.status,
    booking.notes, booking.fee_paid, booking.customer_confirmed, booking.value,
    booking.created_at, booking.starts_at, booking.ends_at, booking.duration_minutes,
    coalesce(
      jsonb_agg(jsonb_build_object(
        'serviceId', item.service_id,
        'name', item.name_snapshot,
        'durationMinutes', item.duration_minutes,
        'price', item.price_snapshot
      ) order by item.position) filter (where item.booking_id is not null),
      '[]'::jsonb
    ) as service_items
  from public.bookings booking
  left join public.booking_services item on item.booking_id = booking.id
  where booking.date between p_start and p_end
  group by booking.id
  order by booking.date, booking.time, booking.id;
end;
$$;

create or replace function public.get_admin_client_history_summaries()
returns table (
  customer_id uuid,
  booking_count bigint,
  total_spent numeric,
  last_booking_date date
)
language plpgsql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
begin
  if auth.uid() is null or public.auth_role() is distinct from 'owner' then
    raise exception using errcode = '42501', message = 'Somente o proprietário pode consultar o histórico dos clientes.';
  end if;

  return query
  select
    profile.id as customer_id,
    count(booking.id)::bigint as booking_count,
    coalesce(sum(booking.value) filter (where booking.status = 'Concluído'), 0)::numeric as total_spent,
    max(booking.date) as last_booking_date
  from public.profiles profile
  left join public.bookings booking on booking.customer_id = profile.id
  where profile.role = 'customer'
  group by profile.id
  order by max(booking.date) desc nulls last, profile.id;
end;
$$;

revoke all on function public.get_admin_report_bookings(date, date) from public, anon;
revoke all on function public.get_admin_client_history_summaries() from public, anon;
grant execute on function public.get_admin_report_bookings(date, date) to authenticated;
grant execute on function public.get_admin_client_history_summaries() to authenticated;
'''
write('supabase/migrations/20260828002000_admin_history_on_demand.sql', sql)

schema = read('supabase/schema.sql')
if 'get_admin_report_bookings(p_start date, p_end date)' not in schema:
    schema += '\n\n-- On-demand administrative history queries\n' + sql
write('supabase/schema.sql', schema)

write('supabase/tests/admin_history_on_demand.sql', r'''begin;

insert into auth.users(id, email, email_confirmed_at, raw_user_meta_data)
values (
  '25000000-0000-4000-8000-000000000001',
  'history-owner@example.test',
  now(),
  '{"name":"History Owner"}'
);
update public.profiles set role = 'owner' where id = '25000000-0000-4000-8000-000000000001';

if has_function_privilege('anon', 'public.get_admin_report_bookings(date,date)', 'EXECUTE')
   or has_function_privilege('anon', 'public.get_admin_client_history_summaries()', 'EXECUTE') then
  raise exception 'TEST FAILURE: anonymous role can execute admin history RPCs';
end if;

set local role authenticated;
select set_config('request.jwt.claim.sub', '25000000-0000-4000-8000-000000000001', true);

select count(*) from public.get_admin_report_bookings(current_date, current_date);
select count(*) from public.get_admin_client_history_summaries();

rollback;
''')

# PostgreSQL does not allow top-level IF; wrap privilege assertion in DO block.
test = read('supabase/tests/admin_history_on_demand.sql')
test = test.replace("if has_function_privilege('anon', 'public.get_admin_report_bookings(date,date)', 'EXECUTE')\n   or has_function_privilege('anon', 'public.get_admin_client_history_summaries()', 'EXECUTE') then\n  raise exception 'TEST FAILURE: anonymous role can execute admin history RPCs';\nend if;", "do $$ begin\n  if has_function_privilege('anon', 'public.get_admin_report_bookings(date,date)', 'EXECUTE')\n     or has_function_privilege('anon', 'public.get_admin_client_history_summaries()', 'EXECUTE') then\n    raise exception 'TEST FAILURE: anonymous role can execute admin history RPCs';\n  end if;\nend $$;")
write('supabase/tests/admin_history_on_demand.sql', test)

# Wire the new DB contract into both clean-schema and migration-specific CI.
p = Path('.github/workflows/quality.yml')
text = p.read_text()
text = replace_once(text, "          --file supabase/tests/admin_business_identity_sync.sql\n", "          --file supabase/tests/admin_business_identity_sync.sql\n          --file supabase/tests/admin_history_on_demand.sql\n", 'quality consolidated history test')
append_step = '''      - name: Validate on-demand admin history queries
        run: >-
          psql --set ON_ERROR_STOP=1
          --file supabase/migrations/20260828002000_admin_history_on_demand.sql
          --file supabase/tests/admin_history_on_demand.sql
'''
if 'Validate on-demand admin history queries' not in text:
    text += '\n' + append_step
p.write_text(text)
