from pathlib import Path
import re

# The server-backed slot path makes the old public local-only checker dead.
p = Path('src/store/appStore.ts')
text = p.read_text()
text = re.sub(r"\n  /\*\*\n   \* Verifica conflitos de horário.*?\n  \}, \[dataState\.professionals, dataState\.bookings, dataState\.scheduleBlocks, dataState\.services, configState\.config\]\);\n", "\n", text, flags=re.S)
# Keep one availability callback instead of a local callback + wrapper.
start = text.find("  const getAvailabilitySlots = useCallback(")
end = text.find("\n\n  const {\n    loading: authLoading", start)
if start < 0 or end < 0: raise SystemExit('availability callbacks not found')
replacement = """  const getAvailableSlots = useCallback(async (professionalId: string, serviceId: string, date: string, excludeBookingId?: string, durationSnapshot?: number, includeElapsed = false): Promise<string[]> => {
    if (!serviceId || !professionalId || !date) return [];
    const occupiedIntervals = await dataService.getOccupiedIntervals(professionalId, date, excludeBookingId);
    const duration = resolveRequestedDuration(serviceId, dataState.services, durationSnapshot);
    const now = getBusinessNow(timeZone);
    const unavailableBeforeMinutes = !includeElapsed && date === now.dateStr ? now.hours * 60 + now.minutes + (configState.config.minimumNoticeMinutes ?? 30) : undefined;
    return getAvailability({
      professionalId, date, duration, intervalMinutes: configState.config.intervalMinutes,
      shopHours: configState.config.workingHours,
      professional: dataState.professionals.find(item => item.id === professionalId),
      bookings: dataState.bookings, blocks: dataState.scheduleBlocks, services: dataState.services,
      unavailableBeforeMinutes, excludeBookingId, additionalOccupiedIntervals: occupiedIntervals,
    }).filter(slot => slot.status === 'available').map(slot => slot.time);
  }, [configState.config, dataState.bookings, dataState.professionals, dataState.scheduleBlocks, dataState.services, timeZone]);
"""
text = text[:start] + replacement + text[end:]
text = text.replace("    isSlotAvailable,\n", "")
text = text.replace("    getAvailabilitySlots,\n", "")
p.write_text(text)

# Retry remains on the critical availability flows; ordinary reports/agenda can retry by changing range/tab.
p = Path('src/features/admin/hooks/useAdminReports.ts')
text = p.read_text().replace("  const [reloadToken, setReloadToken] = useState(0);\n", "")
text = text.replace("  }, [rangeEnd, rangeStart, reloadToken]);", "  }, [rangeEnd, rangeStart]);")
text = text.replace("    loadError,\n    retry: () => setReloadToken(value => value + 1),\n", "    loadError,\n")
p.write_text(text)

p = Path('src/features/admin/components/AdminReportsTab.tsx')
text = p.read_text().replace("    retry,\n", "")
text = text.replace('{loadError && <div className="text-sm text-rose-700">{loadError} <button type="button" className="font-bold underline" onClick={retry}>Tentar novamente</button></div>}', '{loadError && <div className="text-sm text-slate-500">{loadError}</div>}')
p.write_text(text)

p = Path('src/features/admin/components/AdminAgendaTab.tsx')
text = p.read_text().replace("  const [reloadToken, setReloadToken] = useState(0);\n", "")
text = text.replace("  }, [rangeEnd, rangeStart, reloadToken]);", "  }, [rangeEnd, rangeStart]);")
text = text.replace('<div className="p-6 text-sm text-rose-700">{bookingsError} <button type="button" className="font-bold underline" onClick={() => setReloadToken(value => value + 1)}>Tentar novamente</button></div>', '<div className="p-6 text-sm text-slate-500">{bookingsError}</div>')
p.write_text(text)

p = Path('src/features/admin/components/AdminClientsTab.tsx')
text = p.read_text().replace("  const [historyAttempt, setHistoryAttempt] = useState(0);\n", "")
text = text.replace("  }, [historyAttempt]);", "  }, []);")
text = text.replace('      {historyError && <div className="text-sm text-rose-700">{historyError} <button type="button" className="font-bold underline" onClick={() => setHistoryAttempt(value => value + 1)}>Tentar novamente</button></div>}', '      {historyError && <div className="text-sm text-slate-500">{historyError}</div>}')
p.write_text(text)

# Avoid introducing CSS utilities solely for the new error boxes.
for file in ['src/features/admin/components/agenda/AdminBookingForm.tsx', 'src/features/admin/components/agenda/AdminRescheduleDialog.tsx']:
    p = Path(file)
    text = p.read_text().replace('bg-rose-50', 'bg-slate-50').replace('text-rose-700', 'text-slate-600').replace('font-bold underline', 'font-bold')
    p.write_text(text)
