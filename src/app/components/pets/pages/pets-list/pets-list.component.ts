import { Component, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';

import { PET_STATUSES, PetStatus, isPetStatus } from '../../data/pet.model';
import { PetsStore } from '../../data/pets.store';
import { PetCardComponent } from '../../ui/pet-card/pet-card.component';

@Component({
  selector: 'app-pets-list',
  imports: [PetCardComponent],
  templateUrl: './pets-list.component.html',
  styleUrl: './pets-list.component.scss',
})
export class PetsListComponent {
  protected readonly store = inject(PetsStore);
  protected readonly statuses = PET_STATUSES;
  protected readonly skeletonCards = Array.from({ length: 8 }, (_, index) => index);

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly statusParam = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('status'))),
    { initialValue: null },
  );

  constructor() {
    void this.store.ensureLoaded();

    effect(() => {
      const status = this.statusParam();
      this.store.setStatus(isPetStatus(status) ? status : 'available');
    });
  }

  protected selectStatus(status: PetStatus): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { status },
      queryParamsHandling: 'merge',
    });
  }

  protected onSearch(event: Event): void {
    this.store.setQuery((event.target as HTMLInputElement).value);
  }

  protected clearSearch(input: HTMLInputElement): void {
    this.store.clearQuery();
    input.value = '';
    input.focus();
  }

  protected reload(): void {
    void this.store.reload();
  }
}
