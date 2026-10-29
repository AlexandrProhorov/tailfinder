import { Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Pet, PetStatus } from '../../data/pet.model';

const STATUS_NOTES: Record<PetStatus, string> = {
  available: 'Ready to meet',
  pending: 'In foster care',
  adopted: 'Found a home',
};

@Component({
  selector: 'app-pet-card',
  imports: [RouterLink],
  templateUrl: './pet-card.component.html',
  styleUrl: './pet-card.component.scss',
})
export class PetCardComponent {
  readonly pet = input.required<Pet>();
  readonly priority = input(false);

  protected readonly imageFailed = signal(false);
  protected readonly name = computed(() => this.pet().name?.trim() || 'Unnamed pet');
  protected readonly initial = computed(() => this.name().charAt(0).toUpperCase());
  protected readonly category = computed(() => this.pet().category?.name || 'Pet');
  protected readonly tags = computed(() => (this.pet().tags ?? []).slice(0, 2));
  protected readonly note = computed(() => STATUS_NOTES[this.pet().status]);
  protected readonly imageUrl = computed(() => {
    if (this.imageFailed()) {
      return null;
    }

    return (
      (this.pet().photoUrls ?? []).find(
        (url) => url.startsWith('http') && !url.includes('example.com'),
      ) ?? null
    );
  });

  protected onImageError(): void {
    this.imageFailed.set(true);
  }
}
