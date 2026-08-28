import { supabase } from '../lib/supabaseClient';
import {
  type Booking,
  type BusinessConfig,
  type GalleryPhoto,
  type Professional,
  type ScheduleBlock,
  type Service,
  type User,
  type UserRole,
  type WorkingHours,
} from '../types';
import { isAdministratorRole, isProfessionalRole, parseUserRole } from '../auth/authorization';
import { loadPagedRows } from './pagedQuery';

/**
 * Read-only bootstrap path used when the application starts.
 *
 * Mutations remain in dataService. Keeping startup reads here lets us optimize
 * the critical path independently: public and protected requests start in the
 * same network wave, payloads select only fields used by the UI, and large
 * protected collections page at the PostgREST maximum instead of adding an
 * avoidable second request for every 500 rows.
 */

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
  status: Booking['status'];
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
  type: ScheduleBlock['type'];
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

const CONFIG_COLUMNS = 'id,name,logo,address,phone,working_hours,social_links,booking_fee,interval_minutes,booking_window_days,minimum_notice_minutes,cancellation_notice_minutes,pix_key,hero_title,hero_subtitle,hero_description,about_text,updated_at';
const SERVICE_COLUMNS = 'id,name,duration,price,description,category,active,order';
const BLOCK_COLUMNS = 'id,barber_id,type,date,start_date,end_date,start_time,end_time,reason,special_hours';
const GALLERY_COLUMNS = 'id,image_url,caption,order,display_order,created_at';
const BOOKING_COLUMNS = 'id,customer_id,customer_name,customer_phone,barber_id,service_id,date,time,status,notes,fee_paid,customer_confirmed,value,created_at,starts_at,ends_at,duration_minutes';
const PROFILE_COLUMNS = 'id,email,name,role,phone,avatar,profile_id,created_at';

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

const toHHMM = (time: string | null | undefined) => (time ? time.slice(0, 5) : time);

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

export function mapBooking(row: BookingRow): Booking {
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

function mapConfig(row: ConfigRow, settings?: BookingSettingsRow | null): BusinessConfig {
  return {
    name: row.name,
    logo: row.logo,
    address: row.address,
    phone: row.phone,
    workingHours: row.working_hours,
    socialLinks: row.social_links ?? {},
    bookingFee: Number(row.booking_fee),
    intervalMinutes: settings?.interval_minutes ?? row.interval_minutes,
    bookingWindowDays: settings?.booking_window_days ?? row.booking_window_days ?? 3,
    minimumNoticeMinutes: settings?.minimum_notice_minutes ?? row.minimum_notice_minutes ?? 30,
    cancellationNoticeMinutes: settings?.cancellation_notice_minutes ?? row.cancellation_notice_minutes ?? 0,
    pixKey: row.pix_key ?? undefined,
    heroTitle: row.hero_title ?? undefined,
    heroSubtitle: row.hero_subtitle ?? undefined,
    heroDescription: row.hero_description ?? undefined,
    aboutText: row.about_text ?? undefined,
  };
}

async function loadBookings(role?: User['role']): Promise<BookingRow[]> {
  if (!role || isAdministratorRole(role)) return [];
  return loadPagedRows<BookingRow>((from, to) => supabase
    .from('bookings')
    .select(BOOKING_COLUMNS)
    .order('date', { ascending: false })
    .order('time', { ascending: false })
    .order('id', { ascending: false })
    .range(from, to) as unknown as PromiseLike<{ data: BookingRow[] | null; error: { message: string } | null }>);
}

async function loadUsers(role?: User['role']): Promise<ProfileRow[]> {
  if (!isAdministratorRole(role)) return [];
  return loadPagedRows<ProfileRow>((from, to) => supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(from, to) as unknown as PromiseLike<{ data: ProfileRow[] | null; error: { message: string } | null }>);
}

export const bootstrapDataService = {
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

    const galleryQuery = supabase
      .from('gallery_photos')
      .select(GALLERY_COLUMNS)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    // Administration needs the complete media library. Public/customer/
    // professional views render at most six gallery images, so do not transfer
    // an unbounded media catalogue on their critical startup path.
    const galleryRequest = isAdministratorRole(role) ? galleryQuery : galleryQuery.limit(6);

    const bookingsPromise = loadBookings(role);
    const usersPromise = loadUsers(role);

    const [
      configRes,
      settingsRes,
      professionalsRes,
      servicesRes,
      blocksRes,
      galleryRes,
      bookings,
      users,
    ] = await Promise.all([
      supabase.from('barbershop_config').select(CONFIG_COLUMNS).eq('id', true).single(),
      supabase.from('booking_settings').select('interval_minutes,booking_window_days,minimum_notice_minutes,cancellation_notice_minutes').eq('id', true).maybeSingle(),
      professionalsQuery,
      supabase.from('services').select(SERVICE_COLUMNS).order('order', { ascending: true }),
      canReadPrivateBlocks
        ? supabase.from('schedule_blocks').select(BLOCK_COLUMNS)
        : supabase.rpc('get_public_schedule_blocks'),
      galleryRequest,
      bookingsPromise,
      usersPromise,
    ]);

    throwIfError(configRes.error);
    throwIfError(settingsRes.error);
    throwIfError(professionalsRes.error);
    throwIfError(servicesRes.error);
    throwIfError(blocksRes.error);
    throwIfError(galleryRes.error);

    return {
      config: mapConfig(configRes.data as unknown as ConfigRow, settingsRes.data as unknown as BookingSettingsRow | null),
      professionals: ((professionalsRes.data || []) as ProfessionalRow[])
        .map(mapProfessional)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
      services: ((servicesRes.data || []) as unknown as ServiceRow[]).map(mapService),
      bookings: bookings.map(mapBooking),
      users: users.map(mapProfile),
      scheduleBlocks: ((blocksRes.data || []) as unknown as ScheduleBlockRow[]).map(mapScheduleBlock),
      galleryPhotos: ((galleryRes.data || []) as unknown as GalleryPhotoRow[]).map(mapGalleryPhoto),
    };
  },
};
