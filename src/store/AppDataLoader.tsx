import React, { useEffect } from 'react';
import { useAuthStore } from '../auth/store/useAuthStore';
import { dataService } from '../services/dataService';
import { useConfigStore } from './configStore';
import { useDataStore } from './dataStore';

/**
 * Carrega os dados de negócio e inicializa a autenticação uma vez na raiz.
 * O estado real vive nas stores Zustand em `src/store/*`.
 */
export const AppDataLoader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const setInitialData = useDataStore(state => state.setInitialData);
  const beginLoad = useDataStore(state => state.beginLoad);
  const setLoadError = useDataStore(state => state.setLoadError);
  const setConfig = useConfigStore(state => state.setConfig);
  const initializeAuth = useAuthStore(state => state.initialize);
  const authLoading = useAuthStore(state => state.loading);
  const currentUserId = useAuthStore(state => state.currentUser?.id);
  const currentUserRole = useAuthStore(state => state.currentUser?.role);

  useEffect(() => {
    const unsubscribe = initializeAuth();
    return unsubscribe;
  }, [initializeAuth]);

  useEffect(() => {
    if (authLoading) return;

    let mounted = true;
    beginLoad();
    const loadData = async () => {
      try {
        const data = await dataService.loadAllData(currentUserRole);
        if (mounted) {
          setConfig(data.config);
          setInitialData({
            barbers: data.barbers,
            services: data.services,
            bookings: data.bookings,
            users: data.users,
            scheduleBlocks: data.scheduleBlocks || [],
            galleryPhotos: data.galleryPhotos || [],
          });
        }
      } catch (err) {
        if (mounted) {
          setLoadError(
            err instanceof Error ? err.message : 'Não foi possível carregar os dados da barbearia.'
          );
        }
      }
    };
    loadData();
    return () => { mounted = false; };
  }, [authLoading, beginLoad, currentUserId, currentUserRole, setConfig, setInitialData, setLoadError]);

  return <>{children}</>;
};
