from pathlib import Path

p = Path('.github/admin-history-hardening.py')
text = p.read_text()

old = '''text = replace_once(text, "      loadBookings(role),\\n", "      loadBookings(role, adminDate),\\n", 'bootstrap load bookings date')'''
new = '''text = replace_once(text, "    const bookingsPromise = loadBookings(role);\\n", "    const bookingsPromise = loadBookings(role, adminDate);\\n", 'bootstrap load bookings date')'''
if old not in text:
    raise SystemExit('target history transform line not found')
text = text.replace(old, new, 1)

old = '''text = replace_once(text, "          --file supabase/tests/admin_business_identity_sync.sql\\n", "          --file supabase/tests/admin_business_identity_sync.sql\\n          --file supabase/tests/admin_history_on_demand.sql\\n", 'quality consolidated history test')'''
new = '''anchor = "          --file supabase/tests/admin_business_identity_sync.sql\\n"\nif anchor not in text:\n    raise SystemExit('quality consolidated history test anchor not found')\ntext = text.replace(anchor, anchor + "          --file supabase/tests/admin_history_on_demand.sql\\n", 1)'''
if old not in text:
    raise SystemExit('target quality transform line not found')
text = text.replace(old, new, 1)

p.write_text(text)
