from pathlib import Path
import re

p = Path('src/services/dataService.ts')
text = p.read_text()

text = text.replace(
    "import { Professional, Service, BusinessConfig, Booking, BookingServiceItem, User, ScheduleBlock, GalleryPhoto, WorkingHours, UserRole } from '../types';\n"
    "import { isAdministratorRole, isProfessionalRole, parseUserRole } from '../auth/authorization';\n",
    "import { Professional, Service, BusinessConfig, Booking, ScheduleBlock, GalleryPhoto } from '../types';\n",
    1,
)

for type_name in ('ProfileRow', 'ProfessionalRow', 'BookingServiceRow', 'ConfigRow', 'BookingSettingsRow'):
    pattern = re.compile(rf"type {type_name} = \{{.*?\n\}};\n\n", re.S)
    text, count = pattern.subn('', text, count=1)
    if count != 1:
        raise SystemExit(f'{type_name}: expected one declaration, got {count}')

for fn_name in ('mapProfile', 'mapProfessional', 'mapConfig'):
    pattern = re.compile(rf"function {fn_name}\(.*?\n\}}\n\n", re.S)
    text, count = pattern.subn('', text, count=1)
    if count != 1:
        raise SystemExit(f'{fn_name}: expected one function, got {count}')

text = text.replace(
    'function mapBooking(row: BookingRow, serviceItems?: BookingServiceItem[]): Booking {',
    'function mapBooking(row: BookingRow): Booking {',
    1,
)
text = text.replace(
    '    durationMinutes: row.duration_minutes ?? undefined,\n    serviceItems: serviceItems?.length ? serviceItems : undefined,\n',
    '    durationMinutes: row.duration_minutes ?? undefined,\n',
    1,
)

# The active initial-data path is bootstrapDataService. Keeping the old full-load
# implementation here duplicated mapping/query code and forced it into production JS.
pattern = re.compile(
    r"  /\*\*\n   \* Carrega todos os dados iniciais em paralelo\.\n   \*/\n"
    r"  async loadAllData\(role\?: User\['role'\]\): Promise<\{.*?\n  \},\n\n"
    r"  /\*\*\n   \* Config Operations",
    re.S,
)
text, count = pattern.subn("  /**\n   * Config Operations", text, count=1)
if count != 1:
    raise SystemExit(f'legacy loadAllData: expected one method, got {count}')

p.write_text(text)
