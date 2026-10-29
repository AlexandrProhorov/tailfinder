import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'pets' },
  {
    path: 'pets',
    title: 'Browse pets · Tailfinder',
    loadChildren: () => import('./components/pets/pets.routes').then((module) => module.PETS_ROUTES),
  },
  {
    path: '**',
    title: 'Page not found · Tailfinder',
    loadComponent: () =>
      import('./components/not-found/not-found.component').then(
        (module) => module.NotFoundComponent,
      ),
  },
];
