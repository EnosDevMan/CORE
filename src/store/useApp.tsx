import { useAppStore } from './appStore';
import { useDataStore } from './dataStore';
import { useConfigStore } from './configStore';
import { useAuthStore } from '../auth/store/useAuthStore';

export const useApp = useAppStore;

/**
 * Seletores granulares para telas que não precisam assinar o estado inteiro.
 *
 * `useApp()` continua disponível para fluxos que realmente combinam dados,
 * configuração e autenticação. Nas telas mais amplas, preferimos estes hooks
 * para evitar que uma mudança irrelevante (ex: uma legenda da galeria) force
 * re-render da navegação, da home ou de relatórios que não usam esse dado.
 */
export const useProfessionals = () => useDataStore(state => state.professionals);
export const useServices = () => useDataStore(state => state.services);
export const useBookings = () => useDataStore(state => state.bookings);
export const useUsers = () => useDataStore(state => state.users);
export const useScheduleBlocks = () => useDataStore(state => state.scheduleBlocks);
export const useGalleryPhotos = () => useDataStore(state => state.galleryPhotos);
export const useDataLoading = () => useDataStore(state => state.loading);
export const useLoadError = () => useDataStore(state => state.loadError);

export const useAddService = () => useDataStore(state => state.addService);
export const useUpdateService = () => useDataStore(state => state.updateService);
export const useDeactivateService = () => useDataStore(state => state.deactivateService);
export const useUpdateBookingStatus = () => useDataStore(state => state.updateBookingStatus);
export const useAddScheduleBlock = () => useDataStore(state => state.addScheduleBlock);
export const useDeleteScheduleBlock = () => useDataStore(state => state.deleteScheduleBlock);
export const useAddGalleryPhoto = () => useDataStore(state => state.addGalleryPhoto);
export const useUpdateGalleryPhoto = () => useDataStore(state => state.updateGalleryPhoto);
export const useReorderGalleryPhotos = () => useDataStore(state => state.reorderGalleryPhotos);
export const useDeleteGalleryPhoto = () => useDataStore(state => state.deleteGalleryPhoto);
export const useUpdateUserRole = () => useDataStore(state => state.updateUserRole);
export const useDeleteUserAccount = () => useDataStore(state => state.deleteUserAccount);

export const useBusinessConfig = () => useConfigStore(state => state.config);
export const useUpdateBusinessConfig = () => useConfigStore(state => state.updateConfig);
export const useCurrentUser = () => useAuthStore(state => state.currentUser);
export const useLogout = () => useAuthStore(state => state.logout);
export const useAuthInitializationError = () => useAuthStore(state => state.initializationError);
export const usePasswordRecoveryMode = () => useAuthStore(state => state.passwordRecoveryMode);
export const useCompletePasswordRecovery = () => useAuthStore(state => state.completePasswordRecovery);
