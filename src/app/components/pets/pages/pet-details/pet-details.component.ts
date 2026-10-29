import { Component, OnDestroy, computed, effect, inject, input, signal } from '@angular/core';import { RouterLink } from '@angular/router';

import { PetsStore } from '../../data/pets.store';

@Component({
  selector: 'app-pet-details',
  imports: [RouterLink],
  templateUrl: './pet-details.component.html',
  styleUrl: './pet-details.component.scss',
})
export class PetDetailsComponent implements OnDestroy {
  protected readonly store = inject(PetsStore);

  readonly id = input.required<string>();

  protected readonly imageFailed = signal(false);
  protected readonly pet = this.store.selectedPet;
  protected readonly name = computed(() => this.pet()?.name?.trim() || 'Unnamed pet');
  protected readonly initial = computed(() => this.name().charAt(0).toUpperCase());
  protected readonly category = computed(() => this.pet()?.category?.name || 'Pet');
  protected readonly tags = computed(() => this.pet()?.tags ?? []);
  protected readonly imageUrl = computed(() => {
    if (this.imageFailed()) {
      return null;
    }

    return this.findPhoto(this.pet()?.photoUrls);
  });

  constructor() {
    effect(() => {
      const petId = this.id();

      this.imageFailed.set(false);
      void this.store.loadPet(petId);
    });
  }

  ngOnDestroy(): void {
    this.store.clearSelected();
  }

  protected onImageError(): void {
    this.imageFailed.set(true);
  }

  protected reload(): void {
    void this.store.loadPet(this.id(), true);
  }

  private findPhoto(urls: string[] | undefined): string | null {
    return urls?.find((url) => url.startsWith('http') && !url.includes('example.com')) ?? null;
  }
}
