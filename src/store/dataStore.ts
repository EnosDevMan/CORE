import { create } from 'zustand';
import { Barber, Service, Booking, User, ScheduleBlock, BookingStatus, GalleryPhoto } from '../types';
import { dataService } from '../services/dataService';

interface DataState {
  barbers: Barber[];
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
    barbers: Barber[];
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

  // Barbers
  addBarber: (barber: Omit<Barber, 'id'>) => Promise<Barber>;
  updateBarber: (barber: Barber) => Promise<void>;
  deleteBarber: (id: string) => Promise<void>;
  hardDeleteBarber: (id: string) => Promise<void>;
  /** Sincroniza profiles.profile_id <-> barbers.user_id (ver implementação). */
  linkBarberUser: (userId: string, barberId: string | null) => Promise<void>;

  // Services
  addService: (service: Omit<Service, 'id'>) => Promise<void>;
  updateService: (service: Service) => Promise<void>;
  deleteService: (id: string) => Promise<void>;

  // Bookings
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => Promise<Booking>;
  updateBookingStatus: (id: string, status: BookingStatus) => Promise<void>;
  rescheduleBooking: (id: string, date: string, time: string) => Promise<void>;
  confirmBookingAttendance: (id: string) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;

  // Schedule Blocks
  addScheduleBlock: (block: Omit<ScheduleBlock, 'id'>) => Promise<void>;
  updateScheduleBlock: (block: ScheduleBlock) => Promise<void>;
  deleteScheduleBlock: (id: string) => Promise<void>;

  // Gallery Photos
  addGalleryPhoto: (photo: Omit<GalleryPhoto, 'id' | 'createdAt'>) => Promise<void>;
  updateGalleryPhoto: (photo: GalleryPhoto) => Promise<void>;
  deleteGalleryPhoto: (id: string) => Promise<void>;

  // Users
  /**
   * Garante que existe um registro correspondente para o usuário
   * autenticado, criando-o se ainda não existir.
   */
  upsertUser: (user: User) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

export const useDataStore = create<DataState>((set, get) => ({
  barbers: [],
  services: [],
  bookings: [],
  users: [],
  scheduleBlocks: [],
  galleryPhotos: [],
  loading: true,
  loadError: null,

  setInitialData: (data) => set({ ...data, loading: false, loadError: null }),
  beginLoad: () => set({ bookings: [], users: [], loading: true, loadError: null }),
  setLoadError: (message) => set({ loading: false, loadError: message }),

  addBarber: async (barber) => {
    const newBarber = await dataService.createBarber(barber);
    set(state => ({ barbers: [...state.barbers, newBarber] }));
    if (newBarber.userId) {
      // Vincula o usuário escolhido de volta a este barbeiro (ver
      // linkBarberUser abaixo para o porquê disso ser necessário).
      await get().linkBarberUser(newBarber.userId, newBarber.id);
    }
    return newBarber;
  },
  updateBarber: async (barber) => {
    const previous = get().barbers;
    const oldBarber = previous.find(b => b.id === barber.id);
    set(state => ({ barbers: state.barbers.map(b => (b.id === barber.id ? barber : b)) }));
    try {
      await dataService.saveBarber(barber);
      if (oldBarber?.userId !== barber.userId) {
        if (oldBarber?.userId) {
          // Desvincula o usuário anterior (ele não é mais este barbeiro).
          await get().linkBarberUser(oldBarber.userId, null);
        }
        if (barber.userId) {
          await get().linkBarberUser(barber.userId, barber.id);
        }
      }
    } catch (err) {
      set({ barbers: previous });
      throw err;
    }
  },
  /**
   * Mantém `profiles.profile_id` sincronizado com `barbers.user_id`.
   *
   * BUG CORRIGIDO: o formulário de barbeiro (AdminBarberForm) sempre
   * gravou apenas `barbers.user_id` ao vincular um profissional a uma
   * conta de usuário. Só que `useBarberDashboard` decide "qual agenda é a
   * minha" lendo `currentUser.profileId` (= `profiles.profile_id`) — que
   * nunca era escrito. Resultado: todo barbeiro vinculado por lá caía
   * sempre no modo de simulação (seleção manual), nunca no modo automático.
   */
  linkBarberUser: async (userId, barberId) => {
    const previous = get().users;
    set(state => ({
      users: state.users.map(u => (u.id === userId ? { ...u, profileId: barberId ?? undefined } : u)),
    }));
    try {
      await dataService.setUserProfileId(userId, barberId);
    } catch (err) {
      set({ users: previous });
      throw err;
    }
  },
  deleteBarber: async (id) => {
    const previous = get().barbers;
    const barber = previous.find(b => b.id === id);
    if (!barber) return;
    set(state => ({ barbers: state.barbers.map(b => (b.id === id ? { ...b, active: false } : b)) }));
    try {
      await dataService.saveBarber({ ...barber, active: false });
    } catch (err) {
      set({ barbers: previous });
      throw err;
    }
  },
  hardDeleteBarber: async (id) => {
    const previous = get().barbers;
    set(state => ({ barbers: state.barbers.filter(b => b.id !== id) }));
    try {
      await dataService.deleteBarber(id);
    } catch (err) {
      set({ barbers: previous });
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
  deleteService: async (id) => {
    const previous = get().services;
    set(state => ({ services: state.services.filter(s => s.id !== id) }));
    try {
      await dataService.deleteService(id);
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
    const services = get().services;
    const duration = bookingData.serviceId
      .split(',')
      .reduce((sum, subId) => {
        const s = services.find(x => x.id === subId.trim());
        return sum + (s ? s.duration : 30);
      }, 0);

    const newBooking = await dataService.createBooking(bookingData, duration);
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
  deleteBooking: async (id) => {
    const previous = get().bookings;
    set(state => ({ bookings: state.bookings.filter(b => b.id !== id) }));
    try {
      await dataService.deleteBooking(id);
    } catch (err) {
      set({ bookings: previous });
      throw err;
    }
  },

  addScheduleBlock: async (blockData) => {
    const newBlock = await dataService.createScheduleBlock(blockData);
    set(state => ({ scheduleBlocks: [...state.scheduleBlocks, newBlock] }));
  },
  updateScheduleBlock: async (block) => {
    const previous = get().scheduleBlocks;
    set(state => ({ scheduleBlocks: state.scheduleBlocks.map(b => (b.id === block.id ? block : b)) }));
    try {
      await dataService.saveScheduleBlock(block);
    } catch (err) {
      set({ scheduleBlocks: previous });
      throw err;
    }
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
  updateGalleryPhoto: async (photo) => {
    const previous = get().galleryPhotos;
    set(state => ({ galleryPhotos: state.galleryPhotos.map(p => (p.id === photo.id ? photo : p)) }));
    try {
      await dataService.saveGalleryPhoto(photo);
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

  upsertUser: async (user) => {
    const previous = get().users;
    const exists = previous.some(u => u.id === user.id);
    set(state => ({
      users: exists ? state.users.map(u => (u.id === user.id ? user : u)) : [...state.users, user],
    }));
    try {
      await dataService.saveUser(user);
    } catch (err) {
      set({ users: previous });
      throw err;
    }
  },
  updateUser: async (user) => {
    const previous = get().users;
    set(state => ({ users: state.users.map(u => (u.id === user.id ? user : u)) }));
    try {
      await dataService.saveUser(user);
    } catch (err) {
      set({ users: previous });
      throw err;
    }
  },
  deleteUser: async (id) => {
    const previous = get().users;
    set(state => ({ users: state.users.filter(u => u.id !== id) }));
    try {
      await dataService.deleteUser(id);
    } catch (err) {
      set({ users: previous });
      throw err;
    }
  }
}));
