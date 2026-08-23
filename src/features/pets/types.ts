export type PetSize = 'small' | 'medium' | 'large';
export type PetSex = 'female' | 'male' | 'unknown';

export interface Pet {
  id: string;
  ownerId: string;
  name: string;
  species: string;
  breed?: string;
  size?: PetSize;
  birthDate?: string;
  sex?: PetSex;
  restrictions?: string;
  behaviorNotes?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PetNote {
  id: string;
  petId: string;
  authorId?: string;
  note: string;
  createdAt: string;
}
