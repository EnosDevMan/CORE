from pathlib import Path

# 1) Reports must never display rows from a previously successful range after a new range fails.
p = Path('src/features/admin/hooks/useAdminReports.ts')
text = p.read_text()
old = ".catch(error => { if (active) setLoadError(error instanceof Error ? error.message : 'Não foi possível carregar o relatório.'); })"
new = ".catch(error => {\n        if (active) {\n          setBookings([]);\n          setLoadError(error instanceof Error ? error.message : 'Não foi possível carregar o relatório.');\n        }\n      })"
if old in text:
    text = text.replace(old, new, 1)
elif 'setBookings([]);' not in text:
    raise SystemExit('useAdminReports target not found')
p.write_text(text)

# 2) A booking loaded on demand can be absent from the day-scoped owner store.
# After a successful reschedule, upsert the authoritative RPC result instead of only mapping existing rows.
p = Path('src/store/dataStore.ts')
text = p.read_text()
old = "      const updated = await dataService.rescheduleBooking(id, date, time);\n      set(state => ({ bookings: state.bookings.map(b => (b.id === id ? updated : b)) }));"
new = "      const updated = await dataService.rescheduleBooking(id, date, time);\n      set(state => ({\n        bookings: state.bookings.some(b => b.id === id)\n          ? state.bookings.map(b => (b.id === id ? updated : b))\n          : [...state.bookings, updated],\n      }));"
if old in text:
    text = text.replace(old, new, 1)
elif ': [...state.bookings, updated]' not in text:
    raise SystemExit('dataStore reschedule target not found')
p.write_text(text)

# 3) Owner bootstrap is intentionally day-scoped. Keep an open owner/admin session correct across the
# establishment's midnight. Mark the new date before the request so the interval cannot duplicate it;
# reset on failure so the next tick retries.
p = Path('src/store/AppDataLoader.tsx')
text = p.read_text()
old = "    let mounted = true;\n    beginLoad();"
new = "    let mounted = true;\n    let ownerDateWatcher: number | undefined;\n    beginLoad();\n\n    type LoadedData = Awaited<ReturnType<typeof bootstrapDataService.loadAllData>>;\n    const applyData = (data: LoadedData) => {\n      setConfig(data.config);\n      setInitialData({\n        professionals: data.professionals, services: data.services, bookings: data.bookings, users: data.users,\n        scheduleBlocks: data.scheduleBlocks || [], galleryPhotos: data.galleryPhotos || [],\n      });\n    };"
if old in text:
    text = text.replace(old, new, 1)
elif 'const applyData' not in text:
    raise SystemExit('AppDataLoader state target not found')

old = "        if (mounted) {\n          setConfig(data.config);\n          setInitialData({\n            professionals: data.professionals,\n            services: data.services,\n            bookings: data.bookings,\n            users: data.users,\n            scheduleBlocks: data.scheduleBlocks || [],\n            galleryPhotos: data.galleryPhotos || [],\n          });\n        }"
new = "        if (mounted) {\n          applyData(data);\n          if (currentUserRole === 'owner' || currentUserRole === 'admin') {\n            let loadedBusinessDate = getBusinessTodayStr(runtime.profile.timezone);\n            ownerDateWatcher = window.setInterval(() => {\n              const currentBusinessDate = getBusinessTodayStr(runtime.profile.timezone);\n              if (!mounted || currentBusinessDate === loadedBusinessDate) return;\n              loadedBusinessDate = currentBusinessDate;\n              void bootstrapDataService.loadAllData(currentUserRole, currentBusinessDate)\n                .then(freshData => { if (mounted) applyData(freshData); })\n                .catch(() => { loadedBusinessDate = ''; });\n            }, 30_000);\n          }\n        }"
if old in text:
    text = text.replace(old, new, 1)
elif 'loadedBusinessDate' not in text:
    raise SystemExit('AppDataLoader success target not found')

old = "    return () => { mounted = false; };"
new = "    return () => {\n      mounted = false;\n      if (ownerDateWatcher !== undefined) window.clearInterval(ownerDateWatcher);\n    };"
if old in text:
    text = text.replace(old, new, 1)
elif 'clearInterval(ownerDateWatcher)' not in text:
    raise SystemExit('AppDataLoader cleanup target not found')
p.write_text(text)

# Regression test: rescheduling an on-demand booking that is absent from the daily store must insert it.
p = Path('src/store/dataStore.test.ts')
text = p.read_text()
if 'rescheduleBooking: vi.fn(),' not in text:
    text = text.replace("    deleteUserAccount: vi.fn(),", "    deleteUserAccount: vi.fn(),\n    rescheduleBooking: vi.fn(),", 1)

if "upserts an on-demand booking after rescheduling" not in text:
    addition = r'''

describe('day-scoped booking mutations', () => {
  it('upserts an on-demand booking after rescheduling when it is absent from the daily store', async () => {
    const onDemand = { ...booking, id: 'booking-future', date: '2026-09-02', time: '14:00' };
    const updated = { ...onDemand, date: '2026-08-30', time: '16:00' };
    useDataStore.setState({ bookings: [] });
    vi.mocked(dataService.rescheduleBooking).mockResolvedValue(updated);

    await useDataStore.getState().rescheduleBooking(onDemand.id, updated.date, updated.time, onDemand);

    expect(dataService.rescheduleBooking).toHaveBeenCalledWith(onDemand.id, updated.date, updated.time);
    expect(useDataStore.getState().bookings).toEqual([updated]);
  });
});
'''
    text += addition
p.write_text(text)
