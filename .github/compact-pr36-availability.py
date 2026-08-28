from pathlib import Path

Path('src/features/admin/hooks/useAdminAvailableSlots.ts').write_text("""import { useEffect, useState } from 'react';\nimport { getErrorMessage } from '../../../utils/errors';\n\ntype SlotLoader = (professionalId: string, serviceId: string, date: string, excludeBookingId?: string, durationSnapshot?: number, includeElapsed?: boolean) => Promise<string[]>;\n\nexport function useAdminAvailableSlots(loader: SlotLoader, professionalId: string, serviceId: string, date: string, excludeBookingId?: string, durationSnapshot?: number, includeElapsed = false) {\n  const [slots, setSlots] = useState<string[]>([]);\n  const [loading, setLoading] = useState(false);\n  const [error, setError] = useState<string | null>(null);\n  const [attempt, setAttempt] = useState(0);\n\n  useEffect(() => {\n    if (!professionalId || !serviceId || !date) { setSlots([]); setError(null); return; }\n    let active = true;\n    setLoading(true);\n    setError(null);\n    void loader(professionalId, serviceId, date, excludeBookingId, durationSnapshot, includeElapsed)\n      .then(values => { if (active) setSlots(values); })\n      .catch(reason => { if (active) { setSlots([]); setError(getErrorMessage(reason, 'Não foi possível consultar os horários.')); } })\n      .finally(() => { if (active) setLoading(false); });\n    return () => { active = false; };\n  }, [loader, professionalId, serviceId, date, excludeBookingId, durationSnapshot, includeElapsed, attempt]);\n\n  return { slots, loading, error, retry: () => setAttempt(value => value + 1) };\n}\n""")

p = Path('src/features/admin/components/agenda/AdminBookingForm.tsx')
text = p.read_text()
text = text.replace("import React, { useEffect, useState } from 'react';", "import React, { useState } from 'react';", 1)
if "useAdminAvailableSlots" not in text:
    marker = "import { validatePhoneBR } from '../../../../utils/validation';"
    text = text.replace(marker, marker + "\nimport { useAdminAvailableSlots } from '../../hooks/useAdminAvailableSlots';", 1)
start = text.find("  const [slots, setSlots] = useState<string[]>([]);")
if start < 0: raise SystemExit('AdminBookingForm duplicated availability state not found')
end_marker = "  }, [adminProfessionalId, adminServiceId, adminDate, getAvailableSlots, slotsAttempt]);\n"
end = text.find(end_marker, start)
if end < 0: raise SystemExit('AdminBookingForm availability effect end not found')
end += len(end_marker)
replacement = "  const { slots, loading: loadingSlots, error: slotsError, retry: retrySlots } = useAdminAvailableSlots(getAvailableSlots, adminProfessionalId, adminServiceId, adminDate, undefined, undefined, true);\n"
text = text[:start] + replacement + text[end:]
text = text.replace("onClick={() => setSlotsAttempt(value => value + 1)}", "onClick={retrySlots}")
p.write_text(text)

p = Path('src/features/admin/components/agenda/AdminRescheduleDialog.tsx')
text = p.read_text()
text = text.replace("import React, { useEffect, useState } from 'react';", "import React, { useState } from 'react';", 1)
if "useAdminAvailableSlots" not in text:
    marker = "import { useModalAccessibility } from '../../../../hooks/useModalAccessibility';"
    text = text.replace(marker, marker + "\nimport { useAdminAvailableSlots } from '../../hooks/useAdminAvailableSlots';", 1)
start = text.find("  const [slots, setSlots] = useState<string[]>([]);")
if start < 0: raise SystemExit('AdminRescheduleDialog duplicated availability state not found')
end_marker = "  }, [booking.durationMinutes, booking.id, booking.professionalId, booking.serviceId, date, getAvailableSlots, slotsAttempt]);\n"
end = text.find(end_marker, start)
if end < 0: raise SystemExit('AdminRescheduleDialog availability effect end not found')
end += len(end_marker)
replacement = "  const { slots, loading: loadingSlots, error: slotsError, retry: retrySlots } = useAdminAvailableSlots(getAvailableSlots, booking.professionalId, booking.serviceId, date, booking.id, booking.durationMinutes);\n"
text = text[:start] + replacement + text[end:]
text = text.replace("onClick={() => setSlotsAttempt(value => value + 1)}", "onClick={retrySlots}")
p.write_text(text)
