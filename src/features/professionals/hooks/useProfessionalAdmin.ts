import { useDataStore } from '../../../store/dataStore';

/**
 * Niche-neutral boundary for professional administration.
 *
 * UI code consumes only canonical store names. The legacy physical table name
 * remains isolated in the data-access boundary.
 */
export function useProfessionalAdmin() {
  const professionals = useDataStore(state => state.professionals);
  const users = useDataStore(state => state.users);
  const addProfessional = useDataStore(state => state.addProfessional);
  const updateProfessional = useDataStore(state => state.updateProfessional);
  const deleteProfessional = useDataStore(state => state.deleteProfessional);

  return {
    professionals,
    users,
    addProfessional,
    updateProfessional,
    deleteProfessional,
  };
}
