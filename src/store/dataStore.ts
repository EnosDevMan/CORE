import { create } from 'zustand';
import { Professional, Service, Booking, User, ScheduleBlock, BookingStatus, GalleryPhoto } from '../types';
import { dataService } from '../services/dataService';

interface DataState {
  professionals: Professional[];
  services: Service[];
  bookings: Booking[];
  users: User[];
  scheduleBlocks: ScheduleBlock[];
  galleryPhotos: GalleryPhoto[];
  loading: boolean;
  /**
   * Erro do carregamento inicial (ex: Supabase mal configurado, migrations
   * não aplicadas, sem rede). Antes desta correção, um erro aqui deixava
   * `loading` travado em `true` para sempre — a tela de carregamento nunca
   * saía e nenhuma mensagem de erro aparecia (bug real relatado em
   * produção).
   */
  loadError: string | null;

  setInitialData: (data: {
    professionals: Professional[];
    services: Service[];
    bookings: Booking[];
    users: User[];
    scheduleBlocks: ScheduleBlock[];
    galleryPhotos: GalleryPhoto[];
  }) => void;
  /** Inicia uma recarga e remove imediatamente dados protegidos da sessão anterior. */
  beginLoad: () => void;
  /** Marca a carga inicial como falha, destravando a tela de loading. */
  setLoadError: (message: string) => void;

  // Owner-managed application accounts
  updateUserRole: (id: string, role: 'customer' | 'professional') => Promise<void>;
  deleteUserAccount: (id: string) => Promise<void>;

  // Professionals
  addProfessional: (professional: Omit<Professional, 'id'> & { id?: string }) => Promise<Professional>;
  updateProfessional: (professional: Professional) => Promise<void>;
  deactivateProfessional: (id: string) => Promise<void>;

  // Services
  addService: (service: Omit<Service, 'id'>) => Promise<void>;
  updateService: (service: Service) => Promise<void>;
  deactivateService: (id: string) => Promise<void>;

  // Bookings
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => Promise<Booking>;
  addAdministrativeBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => Promise<Booking>;
  updateBookingStatus: (id: string, status: BookingStatus) => Promise<void>;
  rescheduleBooking: (id: string, date: string, time: string) => Promise<void>;
  confirmBookingAttendance: (id: string) => Promise<void>;

  // Schedule Blocks
  addScheduleBlock: (block: Omit<ScheduleBlock, 'id'>) => Promise<void>;
  deleteScheduleBlock: (id: string) => Promise<void>;

  // Gallery Photos
  addGalleryPhoto: (photo: Omit<GalleryPhoto, 'id' | 'createdAt'>) => Promise<void>;
  updateGalleryPhoto: (id: string, caption: string) => Promise<void>;
  reorderGalleryPhotos: (photos: GalleryPhoto[]) => Promise<void>;
  deleteGalleryPhoto: (id: string) => Promise<void>;

}

export const useDataStore = create<DataState>((set, get) => ({
  professionals: [],
  services: [],
  bookings: [],
  users: [],
  scheduleBlocks: [],
  galleryPhotos: [],
  loading: true,
  loadError: null,

  setInitialData: (data) => set({ ...data, loading: false, loadError: null }),
  beginLoad: () => set({ bookings: [], users: [], scheduleBlocks: [], loading: true, loadError: null }),
  setLoadError: (message) => set({ loading: false, loadError: message }),

  updateUserRole: async (id, role) => {
    const user = get().users.find(account => account.id === id);
    if (!user) throw new Error('Conta de usuário não encontrada.');
    if (user.profileId && role !== 'professional') {
      throw new Error('Desvincule a conta do cadastro do profissional antes de alterar seu papel.');
    }

    await dataService.updateUserRole(id, role);
    set(state => ({
      users: state.users.map(account => account.id === id ? { ...account, role } : account),
    }));
  },

  deleteUserAccount: async (id) => {
    if (!get().users.some(account => account.id === id)) {
      throw new Error('Conta de usuário não encontrada.');
    }

    await dataService.deleteUserAccount(id);
    set(state => ({
      users: state.users.filter(account => account.id !== id),
      professionals: state.professionals.map(professional => professional.userId === id
        ? { ...professional, userId: undefined }
        : professional),
      bookings: state.bookings.map(booking => booking.customerId === id
        ? { ...booking, customerId: 'guest' }
        : booking),
    }));
  },

  addProfessional: async (professional) => {
    const newProfessional = await dataService.createProfessional(professional);
    set(state => ({
      professionals: [...state.professionals, newProfessional],
      users: state.users.map(user => newProfessional.userId === user.id
        ? { ...user, profileId: newProfessional.id }
        : user),
    }));
    return newProfessional;
  },
  updateProfessional: async (professional) => {
    const previous = get().professionals;
    const oldProfessional = previous.find(b => b.id === professional.id);
    set(state => ({ professionals: state.professionals.map(b => (b.id === professional.id ? professional : b)) }));
    try {
      await dataService.saveProfessional(professional);
      if (oldProfessional?.userId !== professional.userId) {
        // O trigger `barbers_sync_user_link` altera os dois lados do vínculo
        // dentro da mesma transação do UPDATE. Aqui só espelhamos o resultado
        // já confirmado pelo banco no estado local.
        set(state => ({
          users: state.users.map(user => {
            if (user.id === oldProfessional?.userId) return { ...user, profileId: undefined };
            if (user.id === professional.userId) return { ...user, profileId: professional.id };
            return user;
          }),
        }));
      }
    } catch (err) {
      set({ professionals: previous });
      throw err;
    }
  },
  deactivateProfessional: async (id) => {
    const previous = get().professionals;
    const professional = previous.find(b => b.id === id);
    if (!professional || professional.active === false) return;
    set(state => ({ professionals: state.professionals.map(b => (b.id === id ? { ...b, active: false } : b)) }));
    try {
      await dataService.saveProfessional({ ...professional, active: false });
    } catch (err) {
      set({ professionals: previous });
      throw err;
    }
  },
  addService: async (service) => {
    const newService = await dataService.createService(service);
    set(state => ({ services: [...state.services, newService] }));
  },
  updateService: async (service) => {
    const previous = get().services;
    set(state => ({ services: state.services.map(s => (s.id === service.id ? service : s)) }));
    try {
      await dataService.saveService(service);
    } catch (err) {
      set({ services: previous });
      throw err;
    }
  },
  deactivateService: async (id) => {
    const previous = get().services;
    const service = previous.find(item => item.id === id);
    if (!service || service.active === false) return;
    set(state => ({ services: state.services.map(item => (item.id === id ? { ...item, active: false } : item)) }));
    try {
      await dataService.saveService({ ...service, active: false });
    } catch (err) {
      set({ services: previous });
      throw err;
    }
  },

  addBooking: async (bookingData) => {
    // A criação é feita através de uma função atômica no banco (RPC), que
    // verifica conflitos de horário dentro de uma transação com lock e só
    // então insere o registro, retornando o agendamento já com o id e
    // createdAt definitivos gerados pelo Postgres. Isso elimina a condição
    // de corrida que existia ao gerar o id no cliente e gravar via upsert
    // otimista sem revalidação no servidor. Como o resultado só é aplicado
    // ao estado local depois de confirmado pelo banco, não há necessidade
    // de rollback aqui.
    const newBooking = await dataService.createBooking(bookingData);
    set(state => ({ bookings: [...state.bookings, newBooking] }));
    return newBooking;
  },
  addAdministrativeBooking: async (bookingData) => {
    const newBooking = await dataService.createAdministrativeBooking(bookingData);
    set(state => ({ bookings: [...state.bookings, newBooking] }));
    return newBooking;
  },
  updateBookingStatus: async (id, status) => {
    const previous = get().bookings;
    const booking = previous.find(b => b.id === id);
    if (!booking) return;
    // "Confirmar" (Aguardando pagamento -> Confirmado) é, em toda a UI
    // (barbeiro e admin), o botão que confirma o recebimento do PIX da
    // taxa de reserva — mas antes desta correção nada marcava `feePaid` de
    // fato, então a métrica "Taxas de Agendamento" no painel nunca saía de
    // R$ 0,00.
    const feePaid = status === 'Confirmado' ? true : booking.feePaid;
    set(state => ({ bookings: state.bookings.map(b => (b.id === id ? { ...b, status, feePaid } : b)) }));
    try {
      await dataService.saveBooking({ ...booking, status, feePaid });
    } catch (err) {
      set({ bookings: previous });
      throw err;
    }
  },
  confirmBookingAttendance: async (id) => {
    const previous = get().bookings;
    const booking = previous.find(b => b.id === id);
    if (!booking) return;
    set(state => ({ bookings: state.bookings.map(b => (b.id === id ? { ...b, customerConfirmed: true } : b)) }));
    try {
      await dataService.saveBooking({ ...booking, customerConfirmed: true });
    } catch (err) {
      set({ bookings: previous });
      throw err;
    }
  },
  rescheduleBooking: async (id, date, time) => {
    const previous = get().bookings;
    const booking = previous.find(b => b.id === id);
    if (!booking) return;
    set(state => ({ bookings: state.bookings.map(b => (b.id === id ? { ...b, date, time } : b)) }));
    try {
      // Usa o RPC `reschedule_booking` (lock + revalidação de conflito no
      // servidor), em vez de um UPDATE direto sem nenhuma checagem — dois
      // clientes reagendando para o mesmo horário ao mesmo tempo podiam
      // gerar um conflito de agenda antes desta correção.
      const updated = await dataService.rescheduleBooking(id, date, time);
      set(state => ({ bookings: state.bookings.map(b => (b.id === id ? updated : b)) }));
    } catch (err) {
      set({ bookings: previous });
      throw err;
    }
  },
  addScheduleBlock: async (blockData) => {
    const newBlock = await dataService.createScheduleBlock(blockData);
    set(state => ({ scheduleBlocks: [...state.scheduleBlocks, newBlock] }));
  },
  deleteScheduleBlock: async (id) => {
    const previous = get().scheduleBlocks;
    set(state => ({ scheduleBlocks: state.scheduleBlocks.filter(b => b.id !== id) }));
    try {
      await dataService.deleteScheduleBlock(id);
    } catch (err) {
      set({ scheduleBlocks: previous });
      throw err;
    }
  },

  addGalleryPhoto: async (photo) => {
    const newPhoto = await dataService.createGalleryPhoto(photo);
    set(state => ({ galleryPhotos: [...state.galleryPhotos, newPhoto] }));
  },
  updateGalleryPhoto: async (id, caption) => {
    const previous = get().galleryPhotos;
    set(state => ({ galleryPhotos: state.galleryPhotos.map(photo => (
      photo.id === id ? { ...photo, caption } : photo
    )) }));
    try {
      await dataService.saveGalleryCaption(id, caption);
    } catch (err) {
      set({ galleryPhotos: previous });
      throw err;
    }
  },
  reorderGalleryPhotos: async (photos) => {
    const previous = get().galleryPhotos;
    const reordered = photos.map((photo, index) => ({ ...photo, order: index }));
    set({ galleryPhotos: reordered });
    try {
      await dataService.reorderGalleryPhotos(reordered.map(photo => photo.id));
    } catch (err) {
      set({ galleryPhotos: previous });
      throw err;
    }
  },
  deleteGalleryPhoto: async (id) => {
    const previous = get().galleryPhotos;
    set(state => ({ galleryPhotos: state.galleryPhotos.filter(p => p.id !== id) }));
    try {
      await dataService.deleteGalleryPhoto(id);
    } catch (err) {
      set({ galleryPhotos: previous });
      throw err;
    }
  },

}));
