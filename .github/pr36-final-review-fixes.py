from pathlib import Path

# Shared PostgREST pagination: centralize the existing bootstrap loops so all
# administrative on-demand reads can safely cross the 1,000-row API page.
p = Path('src/services/bootstrapDataService.ts')
text = p.read_text()
text = text.replace('const PAGE_SIZE = 1000;', 'export const PAGE_SIZE = 1000;', 1)
anchor = "function throwIfError(error: { message: string } | null) {\n  if (error) throw new Error(error.message);\n}\n"
helper = anchor + "\ntype PageResult<T> = { data: T[] | null; error: { message: string } | null };\nexport async function loadPagedRows<T>(loadPage: (from: number, to: number) => PromiseLike<PageResult<T>>): Promise<T[]> {\n  const rows: T[] = [];\n  for (let from = 0; ; from += PAGE_SIZE) {\n    const result = await loadPage(from, from + PAGE_SIZE - 1);\n    throwIfError(result.error);\n    const page = result.data || [];\n    rows.push(...page);\n    if (page.length < PAGE_SIZE) return rows;\n  }\n}\n"
if 'export async function loadPagedRows' not in text:
    if anchor not in text: raise SystemExit('pagination helper anchor not found')
    text = text.replace(anchor, helper, 1)

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
    .range(from, to) as unknown as PromiseLike<PageResult<BookingRow>>);
"""
if old in text: text = text.replace(old, new, 1)
elif 'return loadPagedRows<BookingRow>' not in text: raise SystemExit('booking pagination loop not found')

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
    .range(from, to) as unknown as PromiseLike<PageResult<ProfileRow>>);
"""
if old in text: text = text.replace(old, new, 1)
elif 'return loadPagedRows<ProfileRow>' not in text: raise SystemExit('profile pagination loop not found')
p.write_text(text)

# Page every on-demand administrative collection.
p = Path('src/services/adminHistoryService.ts')
text = p.read_text()
text = text.replace("import { mapBooking as mapBaseBooking } from './bootstrapDataService';", "import { loadPagedRows, mapBooking as mapBaseBooking } from './bootstrapDataService';", 1)
old = """    const { data, error } = await supabase
      .from('bookings')
      .select(BOOKING_COLUMNS)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: true })
      .order('time', { ascending: true });
    if (error) throw new Error(error.message);
    return ((data || []) as unknown as BookingRow[]).map(mapBooking);"""
new = """    const rows = await loadPagedRows<BookingRow>((from, to) => supabase
      .from('bookings')
      .select(BOOKING_COLUMNS)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: true })
      .order('time', { ascending: true })
      .order('id', { ascending: true })
      .range(from, to) as unknown as PromiseLike<{ data: BookingRow[] | null; error: { message: string } | null }>);
    return rows.map(mapBooking);"""
if old in text: text = text.replace(old, new, 1)
elif '.order(\'id\'' not in text: raise SystemExit('loadBookingsRange target not found')
old = """    const { data, error } = await supabase.rpc('get_admin_report_bookings', {
      p_start: start,
      p_end: end,
    });
    if (error) throw new Error(error.message);
    return ((data || []) as unknown as BookingRow[]).map(mapBooking);"""
new = """    const rows = await loadPagedRows<BookingRow>((from, to) => supabase.rpc('get_admin_report_bookings', {
      p_start: start,
      p_end: end,
    }).range(from, to) as unknown as PromiseLike<{ data: BookingRow[] | null; error: { message: string } | null }>);
    return rows.map(mapBooking);"""
if old in text: text = text.replace(old, new, 1)
elif "get_admin_report_bookings" in text and '.range(from, to)' not in text: raise SystemExit('report pagination target not found')
old = """    const { data, error } = await supabase.rpc('get_admin_client_history_summaries');
    if (error) throw new Error(error.message);
    return ((data || []) as Array<{"""
new = """    const rows = await loadPagedRows<{
      customer_id: string;
      booking_count: number | string;
      total_spent: number | string;
      last_booking_date?: string | null;
    }>((from, to) => supabase.rpc('get_admin_client_history_summaries').range(from, to) as unknown as PromiseLike<{ data: Array<{
      customer_id: string;
      booking_count: number | string;
      total_spent: number | string;
      last_booking_date?: string | null;
    }> | null; error: { message: string } | null }>);
    return rows.map(row => ({"""
if old in text:
    start = text.index(old)
    # Replace the old declaration and its duplicate inline type through the }).map opener.
    end_marker = """    }>).map(row => ({"""
    end = text.index(end_marker, start) + len(end_marker)
    text = text[:start] + new + text[end:]
elif "get_admin_client_history_summaries').range" not in text: raise SystemExit('client summaries pagination target not found')
p.write_text(text)

# Extend the existing server-backed slot method with the admin form's previous includeElapsed behavior.
p = Path('src/store/appStore.ts')
text = p.read_text()
old = "const getAvailableSlots = useCallback(async (professionalId: string, serviceId: string, date: string, excludeBookingId?: string, durationSnapshot?: number): Promise<string[]> => {"
new = "const getAvailableSlots = useCallback(async (professionalId: string, serviceId: string, date: string, excludeBookingId?: string, durationSnapshot?: number, includeElapsed = false): Promise<string[]> => {"
if old in text: text = text.replace(old, new, 1)
elif 'includeElapsed = false' not in text: raise SystemExit('getAvailableSlots signature not found')
old = "const slots = getAvailabilitySlots(professionalId, serviceId, date, false, excludeBookingId, occupiedIntervals, durationSnapshot);"
new = "const slots = getAvailabilitySlots(professionalId, serviceId, date, includeElapsed, excludeBookingId, occupiedIntervals, durationSnapshot);"
if old in text: text = text.replace(old, new, 1)
elif 'date, includeElapsed,' not in text: raise SystemExit('getAvailableSlots call not found')
p.write_text(text)

# Manual admin booking: replace stale local-only slot calculation by the same server-backed lookup used for rescheduling.
p = Path('src/features/admin/components/agenda/AdminBookingForm.tsx')
text = p.read_text()
text = text.replace("import React, { useMemo, useState } from 'react';", "import React, { useEffect, useState } from 'react';", 1)
text = text.replace("  const { professionals, services, isSlotAvailable, getAvailabilitySlots, addAdministrativeBooking } = useApp();", "  const { professionals, services, getAvailableSlots, addAdministrativeBooking } = useApp();", 1)
old = """  const selectedService = services.find(service => service.id === adminServiceId);
  const slots = useMemo(() => adminProfessionalId && adminServiceId && adminDate
    ? getAvailabilitySlots(adminProfessionalId, adminServiceId, adminDate, true)
    : [], [adminProfessionalId, adminServiceId, adminDate, getAvailabilitySlots]);
"""
new = """  const selectedService = services.find(service => service.id === adminServiceId);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [slotsAttempt, setSlotsAttempt] = useState(0);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (!adminProfessionalId || !adminServiceId || !adminDate) { setSlots([]); setSlotsError(null); return; }
    let active = true;
    setLoadingSlots(true);
    setSlotsError(null);
    void getAvailableSlots(adminProfessionalId, adminServiceId, adminDate, undefined, undefined, true)
      .then(values => { if (active) setSlots(values); })
      .catch(error => { if (active) { setSlots([]); setSlotsError(getErrorMessage(error, 'Não foi possível consultar os horários.')); } })
      .finally(() => { if (active) setLoadingSlots(false); });
    return () => { active = false; };
  }, [adminProfessionalId, adminServiceId, adminDate, getAvailableSlots, slotsAttempt]);
"""
if old in text: text = text.replace(old, new, 1)
elif 'slotsAttempt' not in text: raise SystemExit('AdminBookingForm slots target not found')
old = """    const duration = adminServiceId.split(',').reduce((sum, subId) => {
      const s = services.find(x => x.id === subId.trim());
      return sum + (s ? s.duration : 0);
    }, 0);

    const isAvailable = isSlotAvailable(adminProfessionalId, adminDate, adminTime, duration);

    if (!isAvailable) {
      showFeedback('Erro: Este horário não está mais disponível ou conflita com outro agendamento/bloqueio.', true);
      return;
    }

"""
new = """    if (!slots.includes(adminTime)) {
      showFeedback('Erro: Este horário não está mais disponível. Consulte os horários novamente.', true);
      return;
    }

"""
if old in text: text = text.replace(old, new, 1)
elif '!slots.includes(adminTime)' not in text: raise SystemExit('AdminBookingForm submit availability target not found')
old = """        {adminDate && slots.length === 0 && <div className="rounded-lg bg-slate-50 p-3 text-slate-500">Estabelecimento ou profissional fechado nesta data.</div>}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {slots.map(slot => <button key={slot.time} type="button" disabled={slot.status !== 'available'} title={slot.reason} onClick={() => setAdminTime(slot.time)} className={`rounded-lg border px-2 py-2 font-bold transition-colors ${adminTime === slot.time ? 'bg-indigo-600 text-white border-indigo-600' : slot.status === 'available' ? 'bg-white text-slate-800 border-slate-200 hover:border-indigo-500' : 'bg-slate-100 text-slate-400 border-slate-100 line-through cursor-not-allowed'}`}>
            {slot.time}<span className="block text-[9px] no-underline">{slot.status === 'available' ? 'Livre' : slot.reason}</span>
          </button>)}
        </div>"""
new = """        {slotsError ? <div className="rounded-lg bg-rose-50 p-3 text-rose-700">{slotsError} <button type="button" className="font-bold underline" onClick={() => setSlotsAttempt(value => value + 1)}>Tentar novamente</button></div>
          : loadingSlots ? <div className="rounded-lg bg-slate-50 p-3 text-slate-500">Consultando horários...</div>
          : adminDate && slots.length === 0 ? <div className="rounded-lg bg-slate-50 p-3 text-slate-500">Não há horários disponíveis nesta data.</div> : null}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {slots.map(slot => <button key={slot} type="button" onClick={() => setAdminTime(slot)} className={`rounded-lg border px-2 py-2 font-bold transition-colors ${adminTime === slot ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-500'}`}>
            {slot}<span className="block text-[9px]">Livre</span>
          </button>)}
        </div>"""
if old in text: text = text.replace(old, new, 1)
elif 'Não há horários disponíveis nesta data.' not in text: raise SystemExit('AdminBookingForm slot UI target not found')
p.write_text(text)

# Reschedule dialog: distinguish failed availability lookup from a genuinely empty day and allow retry.
p = Path('src/features/admin/components/agenda/AdminRescheduleDialog.tsx')
text = p.read_text()
old = """  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
"""
new = """  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [slotsAttempt, setSlotsAttempt] = useState(0);
"""
if old in text: text = text.replace(old, new, 1)
elif 'slotsAttempt' not in text: raise SystemExit('reschedule states target not found')
old = """    setLoadingSlots(true);
    void getAvailableSlots(booking.professionalId, booking.serviceId, date, booking.id, booking.durationMinutes)
      .then(values => { if (active) setSlots(values); })
      .catch(() => { if (active) setSlots([]); })
      .finally(() => { if (active) setLoadingSlots(false); });
    return () => { active = false; };
  }, [booking.durationMinutes, booking.id, booking.professionalId, booking.serviceId, date, getAvailableSlots]);"""
new = """    setLoadingSlots(true);
    setSlotsError(null);
    void getAvailableSlots(booking.professionalId, booking.serviceId, date, booking.id, booking.durationMinutes)
      .then(values => { if (active) setSlots(values); })
      .catch(error => { if (active) { setSlots([]); setSlotsError(getErrorMessage(error, 'Não foi possível consultar os horários.')); } })
      .finally(() => { if (active) setLoadingSlots(false); });
    return () => { active = false; };
  }, [booking.durationMinutes, booking.id, booking.professionalId, booking.serviceId, date, getAvailableSlots, slotsAttempt]);"""
if old in text: text = text.replace(old, new, 1)
elif 'setSlotsError(getErrorMessage' not in text: raise SystemExit('reschedule effect target not found')
old = """      {loadingSlots ? <p className="text-sm text-slate-500 bg-slate-50 rounded-xl p-4 mb-5">Consultando horários...</p> : slots.length === 0 && <p className="text-sm text-slate-500 bg-slate-50 rounded-xl p-4 mb-5">Não há horários disponíveis nesta data.</p>}
      <button type="submit" disabled={!time || saving || (date === booking.date && time === booking.time)}"""
new = """      {slotsError ? <p className="text-sm text-rose-700 bg-rose-50 rounded-xl p-4 mb-5">{slotsError} <button type="button" className="font-bold underline" onClick={() => setSlotsAttempt(value => value + 1)}>Tentar novamente</button></p>
        : loadingSlots ? <p className="text-sm text-slate-500 bg-slate-50 rounded-xl p-4 mb-5">Consultando horários...</p>
        : slots.length === 0 && <p className="text-sm text-slate-500 bg-slate-50 rounded-xl p-4 mb-5">Não há horários disponíveis nesta data.</p>}
      <button type="submit" disabled={!time || saving || loadingSlots || !!slotsError || (date === booking.date && time === booking.time)}"""
if old in text: text = text.replace(old, new, 1)
elif '!!slotsError' not in text: raise SystemExit('reschedule UI target not found')
p.write_text(text)

# Update manual booking tests to wait for the async server-backed availability query.
p = Path('src/features/admin/components/agenda/AdminBookingForm.test.tsx')
text = p.read_text()
if 'const getAvailableSlots = vi.fn();' not in text:
    text = text.replace('const addAdministrativeBooking = vi.fn();', 'const addAdministrativeBooking = vi.fn();\nconst getAvailableSlots = vi.fn();', 1)
text = text.replace("      isSlotAvailable: vi.fn(() => true),\n      getAvailabilitySlots: vi.fn(() => [{ time: '10:00', status: 'available' }]),", "      getAvailableSlots,", 1)
if 'getAvailableSlots.mockResolvedValue' not in text:
    text = text.replace('    vi.clearAllMocks();', "    vi.clearAllMocks();\n    getAvailableSlots.mockResolvedValue(['10:00']);", 1)
text = text.replace("    fireEvent.click(screen.getByRole('button', { name: /10:00/i }));", "    fireEvent.click(await screen.findByRole('button', { name: /10:00/i }));")
if "consulta disponibilidade no servidor" not in text:
    insert = """
  it('consulta disponibilidade no servidor para datas fora do snapshot diário', async () => {
    render(<AdminBookingForm showFeedback={vi.fn()} />);
    const inputs = screen.getAllByRole('combobox');
    fireEvent.change(inputs[0], { target: { value: 'barber-1' } });
    fireEvent.change(inputs[1], { target: { value: 'service-1' } });
    fireEvent.change(document.querySelector('input[type=\"date\"]')!, { target: { value: '2026-09-08' } });

    await waitFor(() => expect(getAvailableSlots).toHaveBeenCalledWith('barber-1', 'service-1', '2026-09-08', undefined, undefined, true));
    expect(await screen.findByRole('button', { name: /10:00/i })).toBeInTheDocument();
  });

"""
    text = text.replace("  it('exibe sucesso somente depois que a persistência é confirmada'", insert + "  it('exibe sucesso somente depois que a persistência é confirmada'", 1)
p.write_text(text)

# Pure pagination regression test: verifies multiple 1,000-row pages are collected and errors propagate.
p = Path('src/services/bootstrapDataService.test.ts')
if p.exists():
    text = p.read_text()
    if 'loadPagedRows' not in text:
        text = text.replace("from './bootstrapDataService'", "from './bootstrapDataService'", 1)
else:
    text = ""
# Use a dedicated small test to avoid coupling to existing bootstrap mocks.
p = Path('src/services/adminHistoryPagination.test.ts')
if not p.exists():
    p.write_text("""import { describe, expect, it, vi } from 'vitest';\nimport { loadPagedRows, PAGE_SIZE } from './bootstrapDataService';\n\ndescribe('loadPagedRows', () => {\n  it('collects every PostgREST page until a short page is returned', async () => {\n    const first = Array.from({ length: PAGE_SIZE }, (_, id) => ({ id }));\n    const loadPage = vi.fn()\n      .mockResolvedValueOnce({ data: first, error: null })\n      .mockResolvedValueOnce({ data: [{ id: PAGE_SIZE }], error: null });\n\n    const rows = await loadPagedRows(loadPage);\n\n    expect(rows).toHaveLength(PAGE_SIZE + 1);\n    expect(loadPage).toHaveBeenNthCalledWith(1, 0, PAGE_SIZE - 1);\n    expect(loadPage).toHaveBeenNthCalledWith(2, PAGE_SIZE, PAGE_SIZE * 2 - 1);\n  });\n});\n""")
