export const PET_STATUSES = ['available', 'pending', 'adopted'] as const;

export type PetStatus = (typeof PET_STATUSES)[number];

export interface PetCategory {
  id: number;
  name: string;
}

export interface PetTag {
  id: number;
  name: string;
}

export interface Pet {
  id: string;
  name: string;
  category?: PetCategory;
  photoUrls?: string[];
  tags?: PetTag[];
  status: PetStatus;
}

export function isPetStatus(value: string | null | undefined): value is PetStatus {
  return PET_STATUSES.includes(value as PetStatus);
}
