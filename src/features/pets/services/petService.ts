import { supabase } from '../../../lib/supabaseClient';
import type { Pet, PetSex, PetSize } from '../types';

interface PetRow {
  id: string; owner_id: string; name: string; species: string; breed: string | null;
  size: PetSize | null; birth_date: string | null; sex: PetSex | null;
  restrictions: string | null; behavior_notes: string | null; active: boolean;
  created_at: string; updated_at: string;
}

export type CreatePetInput = Omit<Pet, 'id' | 'active' | 'createdAt' | 'updatedAt'>;

const PET_COLUMNS = 'id,owner_id,name,species,breed,size,birth_date,sex,restrictions,behavior_notes,active,created_at,updated_at';
const PAGE_SIZE = 500;

const mapPet = (row: PetRow): Pet => ({
  id: row.id, ownerId: row.owner_id, name: row.name, species: row.species,
  breed: row.breed ?? undefined, size: row.size ?? undefined,
  birthDate: row.birth_date ?? undefined, sex: row.sex ?? undefined,
  restrictions: row.restrictions ?? undefined,
  behaviorNotes: row.behavior_notes ?? undefined, active: row.active,
  createdAt: row.created_at, updatedAt: row.updated_at,
});

const payload = (pet: CreatePetInput) => ({
  owner_id: pet.ownerId, name: pet.name.trim(), species: pet.species.trim(),
  breed: pet.breed?.trim() || null, size: pet.size ?? null,
  birth_date: pet.birthDate ?? null, sex: pet.sex ?? null,
  restrictions: pet.restrictions?.trim() || null,
  behavior_notes: pet.behaviorNotes?.trim() || null,
});

export const petService = {
  async listAll(): Promise<Pet[]> {
    const rows: PetRow[] = [];
    for (let from = 0; ; from += PAGE_SIZE) {
      const { data, error } = await supabase.from('pets').select(PET_COLUMNS)
        .eq('active', true).order('name').order('id').range(from, from + PAGE_SIZE - 1);
      if (error) throw new Error(error.message);
      rows.push(...((data ?? []) as PetRow[]));
      if ((data?.length ?? 0) < PAGE_SIZE) return rows.map(mapPet);
    }
  },
  async listByOwner(ownerId: string): Promise<Pet[]> {
    const rows: PetRow[] = [];
    for (let from = 0; ; from += PAGE_SIZE) {
      const { data, error } = await supabase.from('pets').select(PET_COLUMNS)
        .eq('owner_id', ownerId).eq('active', true).order('name').order('id').range(from, from + PAGE_SIZE - 1);
      if (error) throw new Error(error.message);
      rows.push(...((data ?? []) as PetRow[]));
      if ((data?.length ?? 0) < PAGE_SIZE) return rows.map(mapPet);
    }
  },
  async create(input: CreatePetInput): Promise<Pet> {
    const { data, error } = await supabase.from('pets').insert(payload(input)).select(PET_COLUMNS).single();
    if (error) throw new Error(error.message);
    return mapPet(data as PetRow);
  },
  async update(pet: Pet): Promise<Pet> {
    const { data, error } = await supabase.from('pets').update(payload(pet))
      .eq('id', pet.id).select(PET_COLUMNS).single();
    if (error) throw new Error(error.message);
    return mapPet(data as PetRow);
  },
};
