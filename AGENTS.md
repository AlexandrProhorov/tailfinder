# Tailfinder

Angular 22 SPA portfolio project: a pet catalogue with real photos from the Dog CEO API,
signal-based feature stores and lazy-loaded routes.

## Commands

- `npm start` - dev server at http://localhost:4200
- `npm run build` - production build into `dist/tailfinder`
- `npm run watch` - development build in watch mode

## Layout

- Root `App` component in `src/app/app.ts` (markup `app.html`) with the shell and `<router-outlet />`
- Feature code in `src/app/components/pets/`:
  - `data/` - model, `*.api.ts` transport, `*.store.ts` state and business rules
  - `pages/` - lazy route components
  - `ui/` - presentational components
- Cross-cutting code in `src/app/core/` (API URL token, error mapping)
- `app.routes.ts` lazy-loads the feature route table in `pets.routes.ts`

## Architecture rules

- Generate components and services with the CLI. `angular.json` is configured so components
  are created as `*.component.ts` / `NameComponent` and services as `*.service.ts` /
  `NameService` without extra flags.
- API services only build requests and return data. No business logic, no state.
- Transport and store layers keep explicit names (`*.api.ts`, `*.store.ts`) because they are
  architectural layers, not generic services.
- Stores own feature state with signals, expose read-only/computed values, and handle
  loading, errors, caching and request races.
- Components inject stores; they never touch `HttpClient` directly.
- Lazy-load features with `loadChildren` / `loadComponent`. Keep route tables feature-local.
- The API base URL comes from the `API_BASE_URL` injection token; swap it to move to a real
  backend without touching stores or components.

## Project rules

- No test runner or `*.spec.ts`: `npm test` has no `test` target in `angular.json`
- Production budgets: initial 500 kB warn / 1 MB error; component styles 4 kB / 8 kB
- `dist/` is generated output - do not edit

## Verification

- Run `npm run build` after changes
- Check lazy chunks in the build output and exercise loading/error/empty states
