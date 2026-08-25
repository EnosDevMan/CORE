import { supabase } from '../lib/supabaseClient';
import { Professional, Service, BusinessConfig, Booking, User, ScheduleBlock, GalleryPhoto, WorkingHours, UserRole } from '../types';
import { isAdministratorRole, isProfessionalRole, parseUserRole } from '../auth/authorization';
export { DEFAULT_PROFESSIONAL_AVATAR as DEFAULT_AVATAR } from '../features/professionals/constants';

/**
 * Camada de Serviço de Acesso aos Dados (Data Service)
 *
 * Fala diretamente com o Supabase (Postgres + RLS). Nada no restante do
 * app (stores, telas) deve importar `@supabase/supabase-js` diretamente —
 * tudo passa por aqui, para que uma futura troca de backend só exija
 * mudanças neste arquivo.
 *
 * Convenção: cada tabela usa `snake_case` no banco; as funções `mapX`
 * abaixo convertem para os tipos `camelCase` de `src/types.ts`.
 */

// Tipos do Supabase (como vêm do wire/JSON)
type ProfileRow = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  profile_id?: string;
  created_at?: string;
};

type ProfessionalRow = {
  id: string;
  name: string;
  avatar: string;
  specialty: string;
  active: boolean;
  working_hours?: WorkingHours;
  description?: string;
  order?: number;
  user_id?: string;
};

type ServiceRow = {
  id: string;
  name: string;
  duration: number;
  price: number | string;
  description: string;
  category: string;
  active: boolean;
  order?: number;
};

type BookingRow = {
  id: string;
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  barber_id: string;
  service_id: string;
  date: string;
  time: string;
  status: 'Aguardando pagamento' | 'Confirmado' | 'Em atendimento' | 'Concluído' | 'Cancelado' | 'Não compareceu';
  notes?: string;
  fee_paid: boolean;
  customer_confirmed?: boolean;
  value: number | string;
  created_at: string;
  starts_at?: string;
  ends_at?: string;
  duration_minutes?: number;
};

type ScheduleBlockRow = {
  id: string;
  barber_id: string;
  type: 'block' | 'offday' | 'vacation' | 'special';
  date?: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  reason?: string;
  special_hours?: ScheduleBlock['specialHours'];
};

type GalleryPhotoRow = {
  id: string;
  image_url: string;
  caption?: string;
  order?: number;
  display_order?: number;
  created_at?: string;
};

type ConfigRow = {
  id: boolean;
  name: string;
  logo: string;
  address: string;
  phone: string;
  working_hours: WorkingHours;
  social_links?: BusinessConfig['socialLinks'];
  booking_fee: number | string;
  interval_minutes: number;
  booking_window_days: number;
  minimum_notice_minutes: number;
  cancellation_notice_minutes: number;
  pix_key?: string;
  hero_title?: string;
  hero_subtitle?: string;
  hero_description?: string;
  about_text?: string;
  updated_at: string;
};

type BookingSettingsRow = {
  interval_minutes: number;
  booking_window_days: number;
  minimum_notice_minutes: number;
  cancellation_notice_minutes: number;
};

type OccupiedIntervalRow = {
  start_time: string;
  duration_minutes: number;
};

// ---------------------------------------------------------------------------
// Mapeamento linha do banco -> tipo do app
// ---------------------------------------------------------------------------

function mapProfile(row: ProfileRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: parseUserRole(row.role),
    phone: row.phone ?? undefined,
    avatar: row.avatar ?? undefined,
    profileId: row.profile_id ?? undefined,
    createdAt: row.created_at ?? undefined,
  };
}

function mapProfessional(row: ProfessionalRow): Professional {
  return {
    id: row.id,
    name: row.name,
    avatar: row.avatar,
    specialty: row.specialty,
    active: row.active,
    workingHours: row.working_hours ?? undefined,
    description: row.description ?? undefined,
    order: row.order ?? undefined,
    userId: row.user_id ?? undefined,
  };
}

function mapService(row: ServiceRow): Service {
  return {
    id: row.id,
    name: row.name,
    duration: row.duration,
    price: Number(row.price),
    description: row.description,
    category: row.category,
    active: row.active,
    order: row.order ?? undefined,
  };
}

const toHHMM = (t: string | null | undefined) => (t ? t.slice(0, 5) : t);

function mapBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    customerId: row.customer_id ?? 'guest',
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    professionalId: row.barber_id,
    serviceId: row.service_id,
    date: row.date,
    time: toHHMM(row.time) as string,
    status: row.status,
    notes: row.notes ?? undefined,
    feePaid: row.fee_paid,
    customerConfirmed: row.customer_confirmed ?? undefined,
    value: Number(row.value),
    createdAt: row.created_at,
    startsAt: row.starts_at ?? undefined,
    endsAt: row.ends_at ?? undefined,
    durationMinutes: row.duration_minutes ?? undefined,
  };
}

function mapScheduleBlock(row: ScheduleBlockRow): ScheduleBlock {
  return {
    id: row.id,
    professionalId: row.barber_id,
    type: row.type,
    date: row.date ?? undefined,
    startDate: row.start_date ?? undefined,
    endDate: row.end_date ?? undefined,
    startTime: toHHMM(row.start_time) ?? undefined,
    endTime: toHHMM(row.end_time) ?? undefined,
    reason: row.reason ?? undefined,
    specialHours: row.special_hours ?? undefined,
  };
}

function mapGalleryPhoto(row: GalleryPhotoRow): GalleryPhoto {
  return {
    id: row.id,
    imageUrl: row.image_url,
    caption: row.caption ?? undefined,
    order: row.display_order ?? row.order ?? undefined,
    createdAt: row.created_at,
  };
}

function mapConfig(row: ConfigRow, bookingSettings?: BookingSettingsRow | null): BusinessConfig {
  return {
    name: row.name,
    logo: row.logo,
    address: row.address,
    phone: row.phone,
    workingHours: row.working_hours,
    socialLinks: row.social_links ?? {},
    bookingFee: Number(row.booking_fee),
    intervalMinutes: bookingSettings?.interval_minutes ?? row.interval_minutes,
    bookingWindowDays: bookingSettings?.booking_window_days ?? row.booking_window_days ?? 3,
    minimumNoticeMinutes: bookingSettings?.minimum_notice_minutes ?? row.minimum_notice_minutes ?? 30,
    cancellationNoticeMinutes: bookingSettings?.cancellation_notice_minutes ?? row.cancellation_notice_minutes ?? 0,
    pixKey: row.pix_key ?? undefined,
    heroTitle: row.hero_title ?? undefined,
    heroSubtitle: row.hero_subtitle ?? undefined,
    heroDescription: row.hero_description ?? undefined,
    aboutText: row.about_text ?? undefined,
  };
}

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export const dataService = {
  /**
   * Carrega todos os dados iniciais em paralelo.
   */
  async loadAllData(role?: User['role']): Promise<{
    config: BusinessConfig;
    professionals: Professional[];
    services: Service[];
    bookings: Booking[];
    users: User[];
    scheduleBlocks: ScheduleBlock[];
    galleryPhotos: GalleryPhoto[];
  }> {
    const canReadPrivateBlocks = isAdministratorRole(role) || isProfessionalRole(role);
    const professionalsQuery = isAdministratorRole(role)
      ? supabase.rpc('get_admin_professionals')
      : supabase.rpc('get_public_professionals');
    const [configRes, settingsRes, professionalsRes, servicesRes, blocksRes, galleryRes] = await Promise.all([
      supabase.from('barbershop_config').select('*').eq('id', true).single(),
      supabase.from('booking_settings').select('interval_minutes, booking_window_days, minimum_notice_minutes, cancellation_notice_minutes').eq('id', true).maybeSingle(),
      professionalsQuery,
      supabase.from('services').select('*').order('order', { ascending: true }),
      canReadPrivateBlocks
        ? supabase.from('schedule_blocks').select('*')
        : supabase.rpc('get_public_schedule_blocks'),
      supabase.from('gallery_photos').select('*').order('display_order', { ascending: true }).order('created_at', { ascending: true }),
    ]);

    throwIfError(configRes.error);
    throwIfError(settingsRes.error);
    throwIfError(professionalsRes.error);
    throwIfError(servicesRes.error);
    throwIfError(blocksRes.error);
    throwIfError(galleryRes.error);

    // Visitantes não consultam tabelas protegidas. Para usuários autenticados,
    // paginação explícita evita o limite silencioso de 1.000 linhas do PostgREST.
    const bookings: BookingRow[] = [];
    if (role) {
      for (let from = 0; ; from += 500) {
        const result = await supabase.from('bookings').select('*').order('date').range(from, from + 499);
        throwIfError(result.error);
        bookings.push(...((result.data || []) as BookingRow[]));
        if ((result.data?.length ?? 0) < 500) break;
      }
    }

    const users: ProfileRow[] = [];
    if (isAdministratorRole(role)) {
      for (let from = 0; ; from += 500) {
        const result = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).range(from, from + 499);
        throwIfError(result.error);
        users.push(...((result.data || []) as ProfileRow[]));
        if ((result.data?.length ?? 0) < 500) break;
      }
    }

    return {
      config: mapConfig(configRes.data, settingsRes.data as BookingSettingsRow | null),
      professionals: ((professionalsRes.data || []) as ProfessionalRow[])
        .map(mapProfessional)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
      services: (servicesRes.data || []).map(mapService),
      bookings: bookings.map(mapBooking),
      users: users.map(mapProfile),
      scheduleBlocks: (blocksRes.data || []).map(mapScheduleBlock),
      galleryPhotos: (galleryRes.data || []).map(mapGalleryPhoto),
    };
  },

  /**
   * Config Operations
   */
  async saveConfig(updated: BusinessConfig): Promise<void> {
    const { error } = await supabase
      .from('barbershop_config')
      .update({
        name: updated.name,
        logo: updated.logo,
        address: updated.address,
        phone: updated.phone,
        working_hours: updated.workingHours,
        social_links: updated.socialLinks,
        booking_fee: updated.bookingFee,
        interval_minutes: updated.intervalMinutes,
        booking_window_days: updated.bookingWindowDays,
        minimum_notice_minutes: updated.minimumNoticeMinutes ?? 30,
        cancellation_notice_minutes: updated.cancellationNoticeMinutes ?? 0,
        pix_key: updated.pixKey,
        hero_title: updated.heroTitle,
        hero_subtitle: updated.heroSubtitle,
        hero_description: updated.heroDescription,
        about_text: updated.aboutText,
        updated_at: new Date().toISOString(),
      })
      .eq('id', true)
      .select('id')
      .single();
    throwIfError(error);
  },

  /**
   * Professional Operations
   */
  async createProfessional(professional: Omit<Professional, 'id'> & { id?: string }): Promise<Professional> {
    const professionalId = professional.id ?? crypto.randomUUID();
    const { data, error } = await supabase
      .from('barbers')
      .insert({
        id: professionalId,
        name: professional.name,
        avatar: professional.avatar,
        specialty: professional.specialty,
        active: professional.active,
        working_hours: professional.workingHours,
        description: professional.description,
        order: professional.order ?? 0,
        user_id: professional.userId,
      })
      .select('id')
      .single();
    throwIfError(error);
    return { ...professional, id: data.id };
  },

  async saveProfessional(professional: Professional): Promise<void> {
    // Esta operação sempre recebe um profissional existente. Usar UPSERT aqui
    // também exige a policy de INSERT do Postgres, que é exclusiva do owner;
    // por isso o profissional conseguia enviar a foto ao Storage, mas a URL não era
    // salva em `barbers.avatar`. UPDATE usa corretamente `barbers_update_own`.
    const { error } = await supabase
      .from('barbers')
      .update({
        name: professional.name,
        avatar: professional.avatar,
        specialty: professional.specialty,
        active: professional.active,
        working_hours: professional.workingHours,
        description: professional.description,
        order: professional.order ?? 0,
        user_id: professional.userId,
      })
      .eq('id', professional.id)
      .select('id')
      .single();
    throwIfError(error);
  },

  /**
   * Service Operations
   */
  async createService(service: Omit<Service, 'id'>): Promise<Service> {
    const { data, error } = await supabase
      .from('services')
      .insert({
        name: service.name,
        duration: service.duration,
        price: service.price,
        description: service.description,
        category: service.category,
        active: service.active ?? true,
        order: service.order ?? 0,
      })
      .select()
      .single();
    throwIfError(error);
    return mapService(data);
  },

  async saveService(service: Service): Promise<void> {
    const { error } = await supabase
      .from('services')
      .update({
        name: service.name,
        duration: service.duration,
        price: service.price,
        description: service.description,
        category: service.category,
        active: service.active ?? true,
        order: service.order ?? 0,
      })
      .eq('id', service.id)
      .select('id')
      .single();
    throwIfError(error);
  },

  /**
   * Booking Operations
   */
  async getOccupiedIntervals(professionalId: string, date: string, excludeBookingId?: string): Promise<{ time: string; duration: number }[]> {
    const { data, error } = await supabase.rpc('get_public_occupied_intervals', {
      p_professional_id: professionalId,
      p_date: date,
      p_exclude_booking_id: excludeBookingId ?? null,
    });
    throwIfError(error);

    return ((data ?? []) as OccupiedIntervalRow[]).map(interval => {
      if (!interval.start_time || !Number.isInteger(interval.duration_minutes) || interval.duration_minutes <= 0) {
        throw new Error('O banco retornou um intervalo de agendamento inválido.');
      }
      return { time: toHHMM(interval.start_time) as string, duration: interval.duration_minutes };
    });
  },

  async createBooking(booking: Omit<Booking, 'id' | 'createdAt'>): Promise<Booking> {
    const { data, error } = await supabase.rpc('create_booking', {
      p_customer_id: booking.customerId === 'guest' ? null : booking.customerId,
      p_customer_name: booking.customerName,
      p_customer_phone: booking.customerPhone,
      p_barber_id: booking.professionalId,
      p_service_id: booking.serviceId,
      p_date: booking.date,
      p_time: booking.time,
      p_notes: booking.notes ?? null,
      p_value: booking.value,
    });
    throwIfError(error);
    return mapBooking(data);
  },

  async createAdministrativeBooking(booking: Omit<Booking, 'id' | 'createdAt'>): Promise<Booking> {
    const { data, error } = await supabase.rpc('create_admin_booking', {
      p_customer_id: booking.customerId === 'guest' ? null : booking.customerId,
      p_customer_name: booking.customerName,
      p_customer_phone: booking.customerPhone,
      p_barber_id: booking.professionalId,
      p_service_id: booking.serviceId,
      p_date: booking.date,
      p_time: booking.time,
      p_notes: booking.notes ?? null,
      p_status: booking.status,
      p_fee_paid: booking.feePaid,
    });
    throwIfError(error);
    return mapBooking(data);
  },

  /**
   * Reagenda um agendamento existente através do RPC `reschedule_booking`,
   * que trava (advisory lock) e revalida conflitos de horário no servidor —
   * assim como `createBooking` já fazia. Um UPDATE direto (como era feito
   * antes) não revalidava nada e permitia condição de corrida entre duas
   * pessoas reagendando para o mesmo horário ao mesmo tempo.
   */
  async rescheduleBooking(id: string, date: string, time: string): Promise<Booking> {
    const { data, error } = await supabase.rpc('reschedule_booking', {
      p_booking_id: id,
      p_new_date: date,
      p_new_time: time,
    });
    throwIfError(error);
    return mapBooking(data);
  },

  async saveBooking(booking: Booking): Promise<void> {
    const { error } = await supabase
      .from('bookings')
      .update({
        customer_name: booking.customerName,
        customer_phone: booking.customerPhone,
        barber_id: booking.professionalId,
        service_id: booking.serviceId,
        date: booking.date,
        time: booking.time,
        status: booking.status,
        notes: booking.notes,
        fee_paid: booking.feePaid,
        customer_confirmed: booking.customerConfirmed,
        value: booking.value,
      })
      .eq('id', booking.id)
      .select('id')
      .single();
    throwIfError(error);
  },

  /**
   * Schedule Block Operations
   */
  async createScheduleBlock(block: Omit<ScheduleBlock, 'id'>): Promise<ScheduleBlock> {
    const { data, error } = await supabase
      .from('schedule_blocks')
      .insert({
        barber_id: block.professionalId,
        type: block.type,
        date: block.date,
        start_date: block.startDate,
        end_date: block.endDate,
        start_time: block.startTime,
        end_time: block.endTime,
        reason: block.reason,
        special_hours: block.specialHours,
      })
      .select()
      .single();
    throwIfError(error);
    return mapScheduleBlock(data);
  },

  async deleteScheduleBlock(id: string): Promise<void> {
    const { error } = await supabase
      .from('schedule_blocks')
      .delete()
      .eq('id', id)
      .select('id')
      .single();
    throwIfError(error);
  },

  /**
   * Gallery Photo Operations
   */
  async createGalleryPhoto(photo: Omit<GalleryPhoto, 'id' | 'createdAt'>): Promise<GalleryPhoto> {
    const { data, error } = await supabase
      .from('gallery_photos')
      .insert({
        image_url: photo.imageUrl,
        caption: photo.caption,
        display_order: photo.order ?? 0,
      })
      .select()
      .single();
    throwIfError(error);
    return mapGalleryPhoto(data);
  },

  async saveGalleryCaption(id: string, caption: string): Promise<void> {
    const { error } = await supabase
      .from('gallery_photos')
      .update({ caption })
      .eq('id', id)
      .select('id')
      .single();
    throwIfError(error);
  },

  async reorderGalleryPhotos(photoIds: string[]): Promise<void> {
    const { error } = await supabase.rpc('reorder_gallery_photos', { p_photo_ids: photoIds });
    throwIfError(error);
  },

  async deleteGalleryPhoto(id: string): Promise<void> {
    const { error } = await supabase
      .from('gallery_photos')
      .delete()
      .eq('id', id)
      .select('id')
      .single();
    throwIfError(error);
  },
};
