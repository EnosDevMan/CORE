import { useAppStore } from './appStore';
import { useDataStore } from './dataStore';
import { useConfigStore } from './configStore';
import { useAuthStore } from '../auth/store/useAuthStore';

export const useApp = useAppStore;

/**
 * Seletores granulares (opcionais) para otimização de performance.
 *
 * `useApp()` combina 3 stores (dados, config, auth) num hook só, sem
 * seletor — qualquer componente que o use re-renderiza sempre que
 * QUALQUER uma das 3 stores muda, mesmo que só use uma fatia pequena do
 * estado (ex: um componente que só precisa de `config` também re-renderiza
 * quando `bookings` muda). Isto não é um bug (o app funciona corretamente
 * hoje), mas é um desperdício de renderizações em telas com muitos
 * componentes.
 *
 * Estes hooks abaixo são um jeito seguro e ADITIVO de mitigar isso: cada
 * um assina só a fatia específica do estado via seletor do Zustand, então
 * só re-renderiza quando AQUELA fatia muda de verdade. Nenhum consumidor
 * existente de `useApp()` foi alterado — são só ferramentas disponíveis
 * para quem for escrever/otimizar um componente novo (ou revisitar um
 * componente que hoje re-renderiza mais do que precisa).
 */
export const useBarbers = () => useDataStore(state => state.barbers);
export const useServices = () => useDataStore(state => state.services);
export const useBookings = () => useDataStore(state => state.bookings);
export const useScheduleBlocks = () => useDataStore(state => state.scheduleBlocks);
export const useGalleryPhotos = () => useDataStore(state => state.galleryPhotos);
export const useBarbershopConfig = () => useConfigStore(state => state.config);
export const useCurrentUser = () => useAuthStore(state => state.currentUser);
