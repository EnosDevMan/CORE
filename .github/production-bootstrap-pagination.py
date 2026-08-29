from pathlib import Path

p = Path('src/services/bootstrapDataService.ts')
text = p.read_text()

anchor = """async function loadUsers(role?: User['role']): Promise<ProfileRow[]> {
  if (!isAdministratorRole(role)) return [];
  return loadPagedRows<ProfileRow>((from, to) => supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(from, to) as unknown as PromiseLike<{ data: ProfileRow[] | null; error: { message: string } | null }>);
}
"""
addition = anchor + """

async function loadPrivateBlocks(role?: User['role']): Promise<ScheduleBlockRow[] | null> {
  if (!isAdministratorRole(role) && !isProfessionalRole(role)) return null;
  return loadPagedRows<ScheduleBlockRow>((from, to) => supabase
    .from('schedule_blocks').select(BLOCK_COLUMNS).order('id').range(from, to)
    as unknown as PromiseLike<{ data: ScheduleBlockRow[] | null; error: { message: string } | null }>);
}

async function loadAdminGallery(role?: User['role']): Promise<GalleryPhotoRow[] | null> {
  if (!isAdministratorRole(role)) return null;
  return loadPagedRows<GalleryPhotoRow>((from, to) => supabase
    .from('gallery_photos').select(GALLERY_COLUMNS)
    .order('display_order').order('created_at').order('id').range(from, to)
    as unknown as PromiseLike<{ data: GalleryPhotoRow[] | null; error: { message: string } | null }>);
}
"""
if anchor not in text:
    raise SystemExit('loadUsers anchor not found')
text = text.replace(anchor, addition, 1)

old = """    // Start protected reads before awaiting the public group. Previously they
    // began only after config/services/gallery finished, creating a full extra
    // network waterfall for authenticated owners.
    const bookingsPromise = loadBookings(role, adminDate);
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
"""
new = """    // Start protected reads before awaiting the public group. Accumulating
    // administrative collections are paged so they cannot silently stop at
    // PostgREST's first response page.
    const bookingsPromise = loadBookings(role, adminDate);
    const usersPromise = loadUsers(role);
    const privateBlocksPromise = loadPrivateBlocks(role);
    const adminGalleryPromise = loadAdminGallery(role);

    const [configRes, settingsRes, professionalsRes, servicesRes, blocksRes, galleryRes, bookings, users, privateBlocks, adminGallery] = await Promise.all([
      supabase.from('barbershop_config').select(CONFIG_COLUMNS).eq('id', true).single(),
      supabase.from('booking_settings').select('interval_minutes,booking_window_days,minimum_notice_minutes,cancellation_notice_minutes').eq('id', true).maybeSingle(),
      professionalsQuery,
      supabase.from('services').select(SERVICE_COLUMNS).order('order', { ascending: true }),
      canReadPrivateBlocks ? Promise.resolve({ data: [], error: null }) : supabase.rpc('get_public_schedule_blocks'),
      isAdministratorRole(role) ? Promise.resolve({ data: [], error: null }) : galleryRequest,
      bookingsPromise,
      usersPromise,
      privateBlocksPromise,
      adminGalleryPromise,
    ]);

    throwIfError(configRes.error);
    throwIfError(settingsRes.error);
    throwIfError(professionalsRes.error);
    throwIfError(servicesRes.error);
    throwIfError(blocksRes.error);
    throwIfError(galleryRes.error);

    return {
      config: mapConfig(configRes.data as unknown as ConfigRow, settingsRes.data as unknown as BookingSettingsRow | null),
      professionals: ((professionalsRes.data || []) as ProfessionalRow[]).map(mapProfessional),
      services: ((servicesRes.data || []) as unknown as ServiceRow[]).map(mapService),
      bookings: bookings.map(mapBooking),
      users: users.map(mapProfile),
      scheduleBlocks: (privateBlocks ?? (blocksRes.data || []) as ScheduleBlockRow[]).map(mapScheduleBlock),
      galleryPhotos: (adminGallery ?? (galleryRes.data || []) as unknown as GalleryPhotoRow[]).map(mapGalleryPhoto),
    };
"""
if old not in text:
    raise SystemExit('loadAllData block not found')
text = text.replace(old, new, 1)

p.write_text(text)
