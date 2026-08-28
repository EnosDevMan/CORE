from pathlib import Path

for path in ('supabase/schema.sql', 'supabase/migrations/20260828002000_admin_history_on_demand.sql'):
    p = Path(path)
    text = p.read_text()
    old = '  time time,\n'
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one unquoted time column, got {count}')
    p.write_text(text.replace(old, '  "time" time,\n', 1))
