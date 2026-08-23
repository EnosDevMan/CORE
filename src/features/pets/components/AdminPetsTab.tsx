import { useEffect, useState } from 'react';
import { AlertCircle, PawPrint } from 'lucide-react';
import { useApp } from '../../../store/useApp';
import { petService } from '../services/petService';
import type { Pet } from '../types';

export function AdminPetsTab() {
  const { users } = useApp();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    petService.listAll()
      .then(result => { if (active) setPets(result); })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Não foi possível carregar os pets.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <div className="grid gap-3 sm:grid-cols-2">{[1, 2, 3, 4].map(item => <div key={item} className="h-28 animate-pulse rounded-2xl bg-slate-200" />)}</div>;
  if (error) return <div role="alert" className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertCircle aria-hidden="true" />{error}</div>;
  if (!pets.length) return <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center"><PawPrint className="mx-auto text-slate-300" size={42} /><h3 className="mt-3 font-bold text-slate-800">Nenhum pet cadastrado</h3><p className="mt-1 text-sm text-slate-500">Os animais vinculados aos tutores aparecerão aqui.</p></div>;

  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{pets.map(pet => {
    const owner = users.find(user => user.id === pet.ownerId);
    return <article key={pet.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><PawPrint aria-hidden="true" /></span><div className="min-w-0"><h3 className="truncate font-extrabold text-slate-900">{pet.name}</h3><p className="text-sm text-slate-500">{pet.species}{pet.breed ? ` · ${pet.breed}` : ''}</p><p className="mt-2 truncate text-xs text-slate-400">Tutor: {owner?.name ?? 'Não identificado'}</p></div></div>{pet.restrictions && <p className="mt-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-900"><strong>Restrições:</strong> {pet.restrictions}</p>}</article>;
  })}</div>;
}
