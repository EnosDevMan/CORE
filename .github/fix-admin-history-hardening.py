from pathlib import Path

p = Path('.github/admin-history-hardening.py')
text = p.read_text()
old = '''text = replace_once(text, "      loadBookings(role),\\n", "      loadBookings(role, adminDate),\\n", 'bootstrap load bookings date')'''
new = '''text = replace_once(text, "    const bookingsPromise = loadBookings(role);\\n", "    const bookingsPromise = loadBookings(role, adminDate);\\n", 'bootstrap load bookings date')'''
if old not in text:
    raise SystemExit('target history transform line not found')
p.write_text(text.replace(old, new, 1))
