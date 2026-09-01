import React, { useEffect } from 'react';
import { useAuthStore } from '../auth/store/useAuthStore';
import { businessService } from '../core/business/businessService';
import { bootstrapDataService } from '../services/bootstrapDataService';
import { useConfigStore } from './configStore';
import { useDataStore } from './dataStore';
import { getBusinessTodayStr } from '../utils/validation';

/**
 * Inicializa autenticação e, depois dela, carrega dados do negócio somente
 * quando existe um perfil já publicado. Instalações novas ficam com stores
 * vazias até o onboarding terminar, evitando expor dados/defaults de nicho.
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
    let ownerDateWatcher: number | undefined;
    beginLoad();

    type LoadedData = Awaited<ReturnType<typeof bootstrapDataService.loadAllData>>;
    const applyData = (data: LoadedData) => {
      setConfig(data.config);
      setInitialData({
        professionals: data.professionals, services: data.services, bookings: data.bookings, users: data.users,
        scheduleBlocks: data.scheduleBlocks || [], galleryPhotos: data.galleryPhotos || [],
      });
    };

    const loadData = async () => {
      try {
        const runtime = await businessService.getRuntime();
        if (!mounted) return;

        if (!runtime) {
          setInitialData({
            professionals: [],
            services: [],
            bookings: [],
            users: [],
            scheduleBlocks: [],
            galleryPhotos: [],
          });
          return;
        }

        const data = await bootstrapDataService.loadAllData(
          currentUserRole,
          getBusinessTodayStr(runtime.profile.timezone),
        );
        if (mounted) {
          applyData(data);
          if (currentUserRole === 'owner' || currentUserRole === 'admin') {
            let loadedBusinessDate = getBusinessTodayStr(runtime.profile.timezone);
            ownerDateWatcher = window.setInterval(() => {
              const currentBusinessDate = getBusinessTodayStr(runtime.profile.timezone);
              if (!mounted || currentBusinessDate === loadedBusinessDate) return;
              void bootstrapDataService.loadAllData(currentUserRole, currentBusinessDate)
                .then(freshData => {
                  if (!mounted) return;
                  loadedBusinessDate = currentBusinessDate;
                  applyData(freshData);
                })
                .catch(() => undefined);
            }, 30_000);
          }
        }
      } catch (err) {
        if (mounted) {
          setLoadError(
            err instanceof Error ? err.message : 'Não foi possível carregar os dados do negócio.'
          );
        }
      }
    };

    void loadData();
    return () => {
      mounted = false;
      if (ownerDateWatcher !== undefined) window.clearInterval(ownerDateWatcher);
    };
  }, [authLoading, beginLoad, currentUserId, currentUserRole, setConfig, setInitialData, setLoadError]);

  return <>{children}</>;
};
