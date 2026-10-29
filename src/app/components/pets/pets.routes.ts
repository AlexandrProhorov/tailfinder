import { Routes } from '@angular/router';

export const PETS_ROUTES: Routes = [
  {
    path: '',
    title: 'Browse pets · Tailfinder',
    loadComponent: () =>
      import('./pages/pets-list/pets-list.component').then((module) => module.PetsListComponent),
  },
  {
    path: ':id',
    title: 'Pet profile · Tailfinder',
    loadComponent: () =>
      import('./pages/pet-details/pet-details.component').then(
        (module) => module.PetDetailsComponent,
      ),
  },
];
