from pathlib import Path

p = Path('src/services/adminHistoryService.ts')
text = p.read_text()
text = text.replace("((from, to) => supabase.from('bookings')", "((from, to) => (supabase.from('bookings')")
text = text.replace(".range(from, to)\n      as unknown as PromiseLike<{ data: BookingRow[] | null; error: { message: string } | null }>);", ".range(from, to) as unknown as PromiseLike<{ data: BookingRow[] | null; error: { message: string } | null }>));", 1)
text = text.replace("((from, to) => supabase.rpc('get_admin_report_bookings'", "((from, to) => (supabase.rpc('get_admin_report_bookings'")
text = text.replace(".range(from, to)\n      as unknown as PromiseLike<{ data: BookingRow[] | null; error: { message: string } | null }>);", ".range(from, to) as unknown as PromiseLike<{ data: BookingRow[] | null; error: { message: string } | null }>));", 1)
text = text.replace("((from, to) => supabase.rpc('get_admin_client_history_summaries')", "((from, to) => (supabase.rpc('get_admin_client_history_summaries')")
text = text.replace(".range(from, to)\n      as unknown as PromiseLike<{ data: SummaryRow[] | null; error: { message: string } | null }>);", ".range(from, to) as unknown as PromiseLike<{ data: SummaryRow[] | null; error: { message: string } | null }>));", 1)
p.write_text(text)
