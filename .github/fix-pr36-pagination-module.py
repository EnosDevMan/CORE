from pathlib import Path

Path('src/services/pagedQuery.ts').write_text("""export const PAGE_SIZE = 1000;\n\ntype PageResult<T> = { data: T[] | null; error: { message: string } | null };\n\nexport async function loadPagedRows<T>(loadPage: (from: number, to: number) => PromiseLike<PageResult<T>>): Promise<T[]> {\n  const rows: T[] = [];\n  for (let from = 0; ; from += PAGE_SIZE) {\n    const result = await loadPage(from, from + PAGE_SIZE - 1);\n    if (result.error) throw new Error(result.error.message);\n    const page = result.data || [];\n    rows.push(...page);\n    if (page.length < PAGE_SIZE) return rows;\n  }\n}\n""")

p = Path('src/services/bootstrapDataService.ts')
text = p.read_text()
if "import { loadPagedRows } from './pagedQuery';" not in text:
    marker = "import { isAdministratorRole, isProfessionalRole, parseUserRole } from '../auth/authorization';"
    text = text.replace(marker, marker + "\nimport { loadPagedRows } from './pagedQuery';", 1)
text = text.replace('export const PAGE_SIZE = 1000;\n', '', 1)
start = text.find('type PageResult<T> = { data: T[] | null; error: { message: string } | null };')
if start >= 0:
    end = text.find('\n\nconst toHHMM', start)
    if end < 0: raise SystemExit('pagination helper end not found')
    text = text[:start] + text[end + 2:]
text = text.replace(' as unknown as PromiseLike<PageResult<BookingRow>>', ' as any')
text = text.replace(' as unknown as PromiseLike<PageResult<ProfileRow>>', ' as any')
p.write_text(text)

p = Path('src/services/adminHistoryService.ts')
text = p.read_text()
text = text.replace("import { loadPagedRows, mapBooking as mapBaseBooking } from './bootstrapDataService';", "import { mapBooking as mapBaseBooking } from './bootstrapDataService';\nimport { loadPagedRows } from './pagedQuery';", 1)
p.write_text(text)

p = Path('src/services/adminHistoryPagination.test.ts')
text = p.read_text().replace("from './bootstrapDataService'", "from './pagedQuery'")
p.write_text(text)
