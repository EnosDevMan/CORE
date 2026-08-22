/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole =
  | 'owner' | 'manager' | 'receptionist' | 'professional' | 'customer'
  /** @deprecated Database compatibility roles. */
  | 'admin' | 'barber';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  profileId?: string; // Professional ID or customer ID
  createdAt?: string;
}

export type { DailyWorkingHours, WorkingHours } from './features/booking/types';
import type { WorkingHours } from './features/booking/types';

export type { Professional } from './features/professionals/types';

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
  professionalId: string;
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

export interface BusinessConfig {
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
  professionalId: string; // "all" for global or a specific professional ID
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
