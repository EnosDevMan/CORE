from pathlib import Path

p = Path('src/services/bootstrapDataService.ts')
text = p.read_text()

old = """  if (isAdministratorRole(role)) {
    if (!adminDate) throw new Error('Data operacional do administrador não informada.');
    const result = await supabase
      .from('bookings')
      .select(BOOKING_COLUMNS)
      .eq('date', adminDate)
      .order('time', { ascending: true });
    throwIfError(result.error);
    return (result.data || []) as unknown as BookingRow[];
  }
"""
new = """  if (isAdministratorRole(role)) {
    if (!adminDate) throw new Error('Data operacional do administrador não informada.');
    return loadPagedRows<BookingRow>((from, to) => supabase
      .from('bookings')
      .select(BOOKING_COLUMNS)
      .eq('date', adminDate)
      .order('time', { ascending: true })
      .order('id', { ascending: true })
      .range(from, to) as unknown as PromiseLike<{ data: BookingRow[] | null; error: { message: string } | null }>);
  }
"""
if old not in text:
    raise SystemExit('admin booking bootstrap block not found')
text = text.replace(old, new, 1)

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

async function loadProfessionals(role?: User['role']): Promise<ProfessionalRow[]> {
  return loadPagedRows<ProfessionalRow>((from, to) => (isAdministratorRole(role)
    ? supabase.rpc('get_admin_professionals')
    : supabase.rpc('get_public_professionals'))
    .range(from, to) as unknown as PromiseLike<{ data: ProfessionalRow[] | null; error: { message: string } | null }>);
}

async function loadServices(): Promise<ServiceRow[]> {
  return loadPagedRows<ServiceRow>((from, to) => supabase
    .from('services')
    .select(SERVICE_COLUMNS)
    .order('order', { ascending: true })
    .order('id', { ascending: true })
    .range(from, to) as unknown as PromiseLike<{ data: ServiceRow[] | null; error: { message: string } | null }>);
}

async function loadScheduleBlocks(role?: User['role']): Promise<ScheduleBlockRow[]> {
  if (!isAdministratorRole(role) && !isProfessionalRole(role)) {
    const result = await supabase.rpc('get_public_schedule_blocks');
    throwIfError(result.error);
    return (result.data || []) as ScheduleBlockRow[];
  }

  return loadPagedRows<ScheduleBlockRow>((from, to) => supabase
    .from('schedule_blocks')
    .select(BLOCK_COLUMNS)
    .order('id', { ascending: true })
    .range(from, to) as unknown as PromiseLike<{ data: ScheduleBlockRow[] | null; error: { message: string } | null }>);
}

async function loadGallery(role?: User['role']): Promise<GalleryPhotoRow[]> {
  const query = supabase
    .from('gallery_photos')
    .select(GALLERY_COLUMNS)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true })
    .order('id', { ascending: true });

  if (!isAdministratorRole(role)) {
    const result = await query.limit(6);
    throwIfError(result.error);
    return (result.data || []) as unknown as GalleryPhotoRow[];
  }

  return loadPagedRows<GalleryPhotoRow>((from, to) => supabase
    .from('gallery_photos')
    .select(GALLERY_COLUMNS)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })
    .range(from, to) as unknown as PromiseLike<{ data: GalleryPhotoRow[] | null; error: { message: string } | null }>);
}
"""
if anchor not in text:
    raise SystemExit('loadUsers anchor not found')
text = text.replace(anchor, addition, 1)

start = text.index("    const canReadPrivateBlocks = isAdministratorRole(role) || isProfessionalRole(role);")
end = text.index("\n\n    // Start protected reads", start)
text = text[:start] + text[end + 2:]

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
new = """    // Start all independent reads together. Collections that may grow past
    // PostgREST's single-response ceiling are paged explicitly instead of
    // silently treating the first 1,000 rows as the complete dataset.
    const [configRes, settingsRes, professionals, services, bookings, users, scheduleBlocks, galleryPhotos] = await Promise.all([
      supabase.from('barbershop_config').select(CONFIG_COLUMNS).eq('id', true).single(),
      supabase.from('booking_settings').select('interval_minutes,booking_window_days,minimum_notice_minutes,cancellation_notice_minutes').eq('id', true).maybeSingle(),
      loadProfessionals(role),
      loadServices(),
      loadBookings(role, adminDate),
      loadUsers(role),
      loadScheduleBlocks(role),
      loadGallery(role),
    ]);

    throwIfError(configRes.error);
    throwIfError(settingsRes.error);

    return {
      config: mapConfig(configRes.data as unknown as ConfigRow, settingsRes.data as unknown as BookingSettingsRow | null),
      professionals: professionals.map(mapProfessional),
      services: services.map(mapService),
      bookings: bookings.map(mapBooking),
      users: users.map(mapProfile),
      scheduleBlocks: scheduleBlocks.map(mapScheduleBlock),
      galleryPhotos: galleryPhotos.map(mapGalleryPhoto),
    };
"""
if old not in text:
    raise SystemExit('loadAllData block not found')
text = text.replace(old, new, 1)

p.write_text(text)
