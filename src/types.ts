/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'barber' | 'customer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  profileId?: string; // Barber ID or Customer ID
  createdAt?: string;
}

export interface WorkingHours {
  open: string; // HH:MM
  close: string; // HH:MM
  daysOpen: number[]; // 0 = Sunday, 1 = Monday, etc.
  breakStart?: string; // HH:MM
  breakEnd?: string; // HH:MM
  /** Per-day schedule. Optional to keep persisted legacy configurations compatible. */
  weeklySchedule?: Partial<Record<number, DailyWorkingHours>>;
}

export interface DailyWorkingHours {
  open: string;
  close: string;
  closed?: boolean;
  breakStart?: string;
  breakEnd?: string;
}

export interface Barber {
  id: string;
  name: string;
  avatar: string;
  specialty: string;
  active: boolean;
  workingHours?: WorkingHours;
  description?: string;
  order?: number;
  userId?: string;
}

export interface Service {
  id: string;
  name: string;
  duration: number; // in minutes
  price: number; // in BRL
  description: string;
  category: string;
  active?: boolean;
  order?: number;
}

export type BookingStatus =
  | 'Aguardando pagamento'
  | 'Confirmado'
  | 'Em atendimento'
  | 'Concluído'
  | 'Cancelado'
  | 'Não compareceu'
  | 'Reagendado';

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  barberId: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: BookingStatus;
  notes?: string;
  feePaid: boolean;
  customerConfirmed?: boolean;
  value: number; // service value at booking time
  createdAt: string;
}

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
}

export interface BarbershopConfig {
  name: string;
  logo: string; // url or emoji/icon key
  address: string;
  phone: string;
  workingHours: WorkingHours;
  socialLinks: SocialLinks;
  bookingFee: number; // R$ 10,00 typical
  toleranceMinutes: number; // 15 minutes typical
  intervalMinutes: number; // 60 minutes typical
  bookingWindowDays: number; // number of calendar days shown to customers, including today
  pixKey?: string; // PIX key for booking fee
  heroTitle?: string;
  heroSubtitle?: string;
  heroDescription?: string;
  aboutText?: string;
}

export type BlockType = 'block' | 'offday' | 'vacation' | 'special';

export interface ScheduleBlock {
  id: string;
  barberId: string; // "all" for global or specific barber ID
  type: BlockType;
  date?: string; // YYYY-MM-DD (for block, offday, special)
  startDate?: string; // YYYY-MM-DD (for vacation, offday range)
  endDate?: string; // YYYY-MM-DD (for vacation, offday range)
  startTime?: string; // HH:MM (for block)
  endTime?: string; // HH:MM (for block)
  reason?: string; // Description e.g., "Almoço", "Consulta", "Feriado"
  specialHours?: {
    open: string; // HH:MM
    close: string; // HH:MM
    breakStart?: string; // HH:MM
    breakEnd?: string; // HH:MM
  };
}

/**
 * Foto da galeria de cortes exibida na home page ("nossos trabalhos").
 * Upload feito pelo admin no painel; não depende de nenhuma API externa
 * (Instagram, etc) — as imagens ficam hospedadas no Supabase Storage.
 */
export interface GalleryPhoto {
  id: string;
  imageUrl: string;
  caption?: string;
  order?: number;
  createdAt?: string;
}
