import { supabase } from '../lib/supabaseClient';
import type { Booking, BookingServiceItem } from '../types';
import { mapBooking as mapBaseBooking } from './bootstrapDataService';
import { loadPagedRows } from './pagedQuery';

type BookingRow = {
  id: string; customer_id?: string; customer_name: string; customer_phone: string;
  barber_id: string; service_id: string; date: string; time: string; status: Booking['status'];
  notes?: string; fee_paid: boolean; customer_confirmed?: boolean; value: number | string;
  created_at: string; starts_at?: string; ends_at?: string; duration_minutes?: number;
  service_items?: BookingServiceItem[] | null;
};

type SummaryRow = { customer_id: string; booking_count: number | string; total_spent: number | string; last_booking_date?: string | null };
export interface ClientHistorySummary { customerId: string; count: number; totalSpent: number; lastDate: string }

const BOOKING_COLUMNS = 'id,customer_id,customer_name,customer_phone,barber_id,service_id,date,time,status,notes,fee_paid,customer_confirmed,value,created_at,starts_at,ends_at,duration_minutes';
const mapBooking = (row: BookingRow): Booking => ({ ...mapBaseBooking(row), serviceItems: row.service_items?.length ? row.service_items : undefined });

export const adminHistoryService = {
  async loadBookingsRange(start: string, end: string): Promise<Booking[]> {
    const rows = await loadPagedRows<BookingRow>((from, to) => (supabase.from('bookings')
      .select(BOOKING_COLUMNS).gte('date', start).lte('date', end)
      .order('date').order('time').order('id').range(from, to) as unknown as PromiseLike<{ data: BookingRow[] | null; error: { message: string } | null }>));
    return rows.map(mapBooking);
  },
  async loadReportBookings(start: string, end: string): Promise<Booking[]> {
    const rows = await loadPagedRows<BookingRow>((from, to) => (supabase.rpc('get_admin_report_bookings', { p_start: start, p_end: end }).range(from, to) as unknown as PromiseLike<{ data: BookingRow[] | null; error: { message: string } | null }>));
    return rows.map(mapBooking);
  },
  async loadClientHistorySummaries(): Promise<ClientHistorySummary[]> {
    const rows = await loadPagedRows<SummaryRow>((from, to) => (supabase.rpc('get_admin_client_history_summaries').range(from, to) as unknown as PromiseLike<{ data: SummaryRow[] | null; error: { message: string } | null }>));
    return rows.map(row => ({ customerId: row.customer_id, count: Number(row.booking_count), totalSpent: Number(row.total_spent), lastDate: row.last_booking_date ?? '' }));
  },
};
