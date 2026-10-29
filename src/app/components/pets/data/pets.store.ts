import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { toErrorMessage } from '../../../core/http/to-error-message';
import { PET_STATUSES, Pet, PetStatus } from './pet.model';
import { PetImage, PetsApi } from './pets.api';

const PET_NAMES = [
  'Bella',
  'Max',
  'Luna',
  'Charlie',
  'Daisy',
  'Rocky',
  'Sadie',
  'Toby',
  'Molly',
  'Bear',
  'Stella',
  'Duke',
  'Penny',
  'Leo',
  'Nala',
  'Finn',
  'Ruby',
  'Oscar',
  'Zoe',
  'Milo',
];

/** Dog CEO uses compact breed slugs; fix the ones that do not split nicely. */
const BREED_NAMES: Record<string, string> = {
  airedale: 'Airedale Terrier',
  bullterrier: 'Bull Terrier',
  'bullterrier-staffordshire': 'Staffordshire Bull Terrier',
  cotondetulear: 'Coton de Tulear',
  germanshepherd: 'German Shepherd',
  greatdane: 'Great Dane',
  lhasa: 'Lhasa Apso',
  mexicanhairless: 'Mexican Hairless',
  shihtzu: 'Shih Tzu',
  stbernard: 'St. Bernard',
};

/** Owns the pets feature state and every business rule around it. */
@Injectable({ providedIn: 'root' })
export class PetsStore {
  private readonly api = inject(PetsApi);

  private readonly _pets = signal<Pet[]>([]);
  private readonly _status = signal<PetStatus>('available');
  private readonly _query = signal('');
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  private readonly _selectedPet = signal<Pet | null>(null);
  private readonly _selectedLoading = signal(false);
  private readonly _selectedError = signal<string | null>(null);

  private listRequestId = 0;
  private detailsRequestId = 0;

  readonly pets = this._pets.asReadonly();
  readonly status = this._status.asReadonly();
  readonly query = this._query.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly selectedPet = this._selectedPet.asReadonly();
  readonly selectedLoading = this._selectedLoading.asReadonly();
  readonly selectedError = this._selectedError.asReadonly();

  readonly isFiltered = computed(() => this._query().trim().length > 0);

  readonly total = computed(
    () => this._pets().filter((pet) => pet.status === this._status()).length,
  );

  readonly filteredPets = computed(() => {
    const query = this._query().trim().toLowerCase();
    const status = this._status();

    return this._pets().filter((pet) => {
      if (pet.status !== status) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [pet.name, pet.category?.name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  });

  readonly hasPets = computed(() => this.filteredPets().length > 0);

  async load(): Promise<void> {
    const requestId = ++this.listRequestId;

    this._loading.set(true);
    this._error.set(null);

    try {
      const images = await firstValueFrom(this.api.list());

      if (requestId !== this.listRequestId) {
        return;
      }

      this._pets.set(this.normalize(images));
    } catch (error) {
      if (requestId !== this.listRequestId) {
        return;
      }

      this._pets.set([]);
      this._error.set(toErrorMessage(error));
    } finally {
      if (requestId === this.listRequestId) {
        this._loading.set(false);
      }
    }
  }

  /** Load once; navigating back to the list should reuse what is already there. */
  async ensureLoaded(): Promise<void> {
    if (this._pets().length > 0 || this._loading()) {
      return;
    }

    await this.load();
  }

  async reload(): Promise<void> {
    await this.load();
  }

  setStatus(status: PetStatus): void {
    this._status.set(status);
  }

  setQuery(query: string): void {
    this._query.set(query);
  }

  clearQuery(): void {
    this._query.set('');
  }

  async loadPet(id: string, force = false): Promise<void> {
    const cached = force ? undefined : this._pets().find((pet) => pet.id === id);

    if (cached) {
      this.detailsRequestId++;
      this._selectedPet.set(cached);
      this._selectedLoading.set(false);
      this._selectedError.set(null);
      return;
    }

    const requestId = ++this.detailsRequestId;

    this._selectedPet.set(null);
    this._selectedLoading.set(true);
    this._selectedError.set(null);

    try {
      const image = await firstValueFrom(this.api.getById(id));

      if (requestId !== this.detailsRequestId) {
        return;
      }

      this._selectedPet.set(this.toPet(image));
    } catch (error) {
      if (requestId !== this.detailsRequestId) {
        return;
      }

      this._selectedError.set(toErrorMessage(error));
    } finally {
      if (requestId === this.detailsRequestId) {
        this._selectedLoading.set(false);
      }
    }
  }

  clearSelected(): void {
    this.detailsRequestId++;
    this._selectedPet.set(null);
    this._selectedLoading.set(false);
    this._selectedError.set(null);
  }

  /** API returns random breeds; duplicates and empty entries are normal. */
  private normalize(images: PetImage[]): Pet[] {
    const seen = new Set<string>();

    return images
      .filter((image) => {
        if (seen.has(image.id)) {
          return false;
        }

        seen.add(image.id);
        return true;
      })
      .map((image) => this.toPet(image))
      .sort((a, b) => (a.category?.name ?? '').localeCompare(b.category?.name ?? ''));
  }

  private toPet(image: PetImage): Pet {
    return {
      id: image.id,
      name: PET_NAMES[this.hash(image.id) % PET_NAMES.length],
      category: {
        id: this.hash(image.breed),
        name: this.formatBreed(image.breed),
      },
      photoUrls: [image.photoUrl],
      tags: [],
      status: this.statusFor(image.id),
    };
  }

  private formatBreed(slug: string): string {
    const known = BREED_NAMES[slug];

    if (known) {
      return known;
    }

    const [breed, ...subBreeds] = slug.split('-');
    const title = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

    if (subBreeds.length === 0) {
      return title(breed);
    }

    return `${subBreeds.map(title).join(' ')} ${title(breed)}`;
  }

  /** Stable pseudo-random status: 60% available, 20% pending, 20% adopted. */
  private statusFor(id: string): PetStatus {
    const bucket = this.hash(`${id}:status`) % 10;

    if (bucket < 6) {
      return 'available';
    }

    if (bucket < 8) {
      return 'pending';
    }

    return 'adopted';
  }

  /** FNV-1a: tiny, deterministic hash for demo profile data. */
  private hash(value: string): number {
    let hash = 2166136261;

    for (let index = 0; index < value.length; index++) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
  }
}
