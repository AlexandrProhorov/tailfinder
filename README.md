# Tailfinder

A small Angular 22 portfolio project that explores a clean, scalable feature architecture:
**lazy routes**, **signal state**, and a strict split between transport (`*.api.ts`) and
business logic (`*.store.ts`).

The catalogue currently runs on the public [Dog CEO API](https://dog.ceo/dog-api/) with real
photos and breed data. A tiny demo layer in the store adds pet names and adoption statuses.
It is intentionally replaceable: point `API_BASE_URL` at our own backend and only the
transport layer changes.

## Stack

- Angular 22, standalone components, no `zone.js`
- Signals + `computed` for all feature state
- Reactive forms + Angular Material 3 (adoption application)
- SCSS with design tokens and a custom Material theme
- Lazy loading via `loadChildren` and `loadComponent`

## Run

```bash
npm install
npm start      # http://localhost:4200
npm run build  # production build
```

## Architecture

```
src/app/
  core/
    config/api.config.ts      # API_BASE_URL token + temporary provider
    http/to-error-message.ts  # one place for transport errors
  components/
    pets/
      data/
        pet.model.ts          # domain models
        pets.api.ts           # HTTP only
        pets.store.ts         # state + business rules
        adoption.model.ts     # typed form controls + application model
        adoption.store.ts     # local demo persistence
      pages/
        pets-list/            # lazy route
        pet-details/          # lazy route
        adoption-form/        # reactive form + Material, lazy route
      ui/
        pet-card/             # dumb presentational component
      pets.routes.ts          # feature route table
    not-found/
  app.routes.ts               # shell routes, feature lazy boundary
  app.config.ts               # router + HttpClient providers
```

**Rule:** an API service never decides anything. It builds a request and returns data.
A store never touches `HttpClient`. It owns requests, loading/error state, caching,
race protection and derived values.

Generated components are `*.component.ts`; generated services are `*.service.ts`
(`angular.json` schematics). The `*.api.ts` / `*.store.ts` files keep explicit layer
names on purpose.

```
component → store → api → HTTP
     ↑         ↓
   signals ← state
```

### Why this shape

- Feature routes are split into their own lazy chunks. `npm run build` shows `pets-routes`,
  `pets-list-component` and `pet-details-component` as separate chunks.
- Stores expose read-only signals and `computed` values; templates never mutate state.
- `loadPet()` serves from the list cache when possible and fetches only on a direct link
  or an explicit refresh.
- List and details requests use request ids, so a slow response cannot overwrite a newer one.
- `status` lives in the URL (`/pets?status=pending`), so tabs are shareable and
  back/forward work.
- The adoption form is a typed reactive form: `ngOnInit` → `#initForm` →
  `#setSubscription`, `valueChanges` with `takeUntilDestroyed`, Material fields and a
  live completion bar.
- Loading, error and empty states are first-class, not an afterthought.

## Routes

| Path | Loading | Purpose |
| --- | --- | --- |
| `/` | redirect | goes to `/pets` |
| `/pets` | lazy children | catalogue |
| `/pets?status=available\|pending\|adopted` | query param | status filter |
| `/pets/:id` | lazy component | pet profile |
| `/pets/:id/apply` | lazy component | adoption application form |
| `/**` | lazy component | 404 |

`withComponentInputBinding()` is enabled, so the `:id` route param arrives through an
`input()` signal instead of `ActivatedRoute` plumbing.

## Data source note

Swagger Petstore was the first candidate, but its demo data is mostly test noise and its
`/pet/{id}` endpoint regularly returns 404. Dog CEO gives stable, CORS-enabled photos and
breed slugs, which makes the UI honest and presentable. The profile fields are a temporary
demo layer; the next iteration replaces them with our own backend and real CRUD.

The adoption form is persisted to `localStorage` for the demo. Submit is a one-shot
promise handled with `.then` / `.catch` / `.finally`; swapping in a real API means changing
`AdoptionStore.submit`, not the form.

## Next iterations

1. Add `CanDeactivate` and draft autosave to the adoption form; split it into steps with
   `FormArray` for household members.
2. Create/edit pet pages backed by our own API, with `CanActivate` for the admin area.
3. Query-param search, resolver-based detail loading, custom `TitleStrategy`.
4. Component tests (Vitest) once the project rule against a test runner is lifted.

## Project rules

- No `*.spec.ts`, no test runner configured
- Production budgets: 500 kB / 1 MB initial, 4 kB / 8 kB per component style
- `dist/` is generated output
