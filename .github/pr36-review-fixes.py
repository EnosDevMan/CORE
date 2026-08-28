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

# 3) Owner bootstrap is intentionally day-scoped. Keep an open session correct across the
# establishment's midnight by checking the business date and silently refreshing only when it changes.
p = Path('src/store/AppDataLoader.tsx')
text = p.read_text()
import_anchor = "import { getBusinessTodayStr } from '../utils/validation';"
if "isAdministratorRole" not in text:
    text = text.replace(import_anchor, import_anchor + "\nimport { isAdministratorRole } from '../auth/authorization';", 1)

old = "    let mounted = true;\n    beginLoad();"
new = "    let mounted = true;\n    let ownerDateWatcher: number | undefined;\n    let refreshingBusinessDate = false;\n    beginLoad();\n\n    type LoadedData = Awaited<ReturnType<typeof bootstrapDataService.loadAllData>>;\n    const applyData = (data: LoadedData) => {\n      setConfig(data.config);\n      setInitialData({\n        professionals: data.professionals, services: data.services, bookings: data.bookings, users: data.users,\n        scheduleBlocks: data.scheduleBlocks || [], galleryPhotos: data.galleryPhotos || [],\n      });\n    };"
if old in text:
    text = text.replace(old, new, 1)
elif 'const applyData' not in text:
    raise SystemExit('AppDataLoader state target not found')

old = "        if (mounted) {\n          setConfig(data.config);\n          setInitialData({\n            professionals: data.professionals,\n            services: data.services,\n            bookings: data.bookings,\n            users: data.users,\n            scheduleBlocks: data.scheduleBlocks || [],\n            galleryPhotos: data.galleryPhotos || [],\n          });\n        }"
new = "        if (mounted) {\n          applyData(data);\n          if (isAdministratorRole(currentUserRole)) {\n            let loadedBusinessDate = getBusinessTodayStr(runtime.profile.timezone);\n            ownerDateWatcher = window.setInterval(() => {\n              if (!mounted || refreshingBusinessDate) return;\n              const currentBusinessDate = getBusinessTodayStr(runtime.profile.timezone);\n              if (currentBusinessDate === loadedBusinessDate) return;\n              refreshingBusinessDate = true;\n              void bootstrapDataService.loadAllData(currentUserRole, currentBusinessDate)\n                .then(freshData => {\n                  if (!mounted) return;\n                  loadedBusinessDate = currentBusinessDate;\n                  applyData(freshData);\n                })\n                .catch(() => undefined)\n                .finally(() => { refreshingBusinessDate = false; });\n            }, 30_000);\n          }\n        }"
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
