---
tags: [development]
---

# Conventions

> [!important] Canonical rules moved
> [[AI Coding Conventions]] is now the canonical, binding rulebook — read it first. This page
> remains as a shorter "patterns observed" quick reference and has been updated to match the
> post-refactor structure (`app/models/`, `app/schemas/`, `app/services/`, `app/repositories/`,
> `app/api/routes/`, `lib/api/`).

Patterns observed consistently across the codebase — follow these when adding to either side.

## Backend (Python / FastAPI)

- **SQLAlchemy 2.0 declarative style**: `Mapped[type]` + `mapped_column(...)`, never the
  legacy `Column(...)` style. See [[Backend/Models|Backend Models]].
- **Enums are `class X(str, Enum)`** so they serialize as plain strings and work directly as
  both the SQLAlchemy column type and the Pydantic field type — no manual `.value` conversion
  needed at the API boundary.
- **Every request/response schema inherits `ApiModel`**, which sets
  `alias_generator=to_camel, populate_by_name=True, from_attributes=True` — this is how
  Python's `snake_case` fields become the API's `camelCase` JSON automatically. Never hand-roll
  camelCase field names in a schema; write `snake_case` and let `ApiModel` convert it.
- **Money is always an `int` in minor units** plus a 3-letter `currency` string. Never a
  `float`/`Decimal` for stored money. See [[Database/Schema|Database Schema]].
- **Auth via typed dependencies**, not inline checks: annotate a handler parameter as
  `user: CurrentUser` or `user: AdminUser` (from `api/dependencies.py`) rather than checking
  `user.role` manually inside the function body. See [[Backend/Authentication|Backend Authentication]].
- **Activity-worthy mutations call `log_activity(db, "EntityType", id, "ACTION", description)`**
  (`app/services/activity.py`) in the same function, before `db.commit()`, so the log entry and
  the change land in one transaction. Action strings are `SCREAMING_SNAKE_CASE` verbs
  (`CREATE`, `UPDATE`, `DELETE`, `CONVERT`, `PAID`) — reuse them for new mutations.
- **Unique-constraint violations are caught explicitly**: wrap the `db.flush()`/`db.commit()`
  that could violate a unique constraint in `try/except IntegrityError`, `db.rollback()`, then
  raise `HTTPException(409, "<human message>.")`. This repeats in every create/update endpoint
  that touches a unique column.
- **Routes are thin; business logic lives in `app/services/`, per-domain repeated queries live
  in `app/repositories/`.** `app/api/routes/*.py` handlers parse the request, call one or two
  service/repository functions, and return a response — see [[AI Coding Conventions]] §4 for
  the exact boundary and [[Backend/Services|Backend Services]] for the current function
  inventory.
- **Lint with `ruff check app`** before committing; the project has no `black`/`isort` config
  beyond what `ruff` enforces.

## Frontend (TypeScript / React)

- **Function components only**, no class components anywhere.
- **Atomic design folders**: put a new primitive in `atoms/`, a small composition in
  `molecules/`, a page-section-sized piece in `organisms/` — see [[Frontend/Components|Frontend Components]]
  for the existing inventory before adding a near-duplicate.
- **No CSS files per component** — style with Tailwind utility classes inline on the `className`
  prop. Only `styles.css` exists, and it's for design tokens + the Tailwind import, not
  component styles. See [[Frontend/UI Architecture|Frontend UI Architecture]].
- **Relative imports**, no path aliases (`../components/atoms`, `../lib/api`, etc.).
- **`types.ts` mirrors the backend's Pydantic schemas by hand** — there is no code generation
  from the OpenAPI schema. When you add/change a backend schema field, update the matching
  frontend interface yourself (and remember the camelCase conversion is automatic on the wire,
  so `types.ts` should already be camelCase to match).
- **No global state library.** Cross-cutting concerns are a small `Context` (see
  `auth.tsx`, `theme.tsx`); everything else is page-local `useState`/`useEffect` calling a
  `lib/api/<domain>.ts` function. Don't introduce Redux/Zustand/React Query for a single page's
  data — follow the existing per-page `load()` pattern in [[Frontend/State Management|Frontend State Management]].
- **Feature API calls live in `lib/api/<domain>.ts`** (`employees.ts`, `projects.ts`,
  `payroll.ts`, `hiring.ts`, `home.ts`, `settings.ts`, `users.ts`, `auth.ts`), each a thin
  wrapper around `lib/api/client.ts: api()`. Don't call `api()` with a hardcoded path string
  from inside a page or component — add/extend the matching domain function instead.
- **Money in minor units uses the `MoneyInput` molecule** (`components/molecules/MoneyInput.tsx`)
  rather than a bare `Input` with manual `/100`/`*100` conversion inline, for any field whose
  state is tracked in minor units. A field whose local form state is already a major-unit
  string (see `payroll.tsx`) can stay a plain `Input`.
- **Shared option lists live in `lib/options.ts`** (`EMPLOYEE_TYPES`, `EMPLOYEE_STATUSES`,
  `PROJECT_STATUSES`, `JOB_STATUSES`, `CANDIDATE_STAGES`, `USER_ROLES`, `DOCUMENT_KINDS`) —
  don't inline a new copy of one of these arrays in a page.
- **Enum-like unions in `types.ts`** (e.g. `type ProjectStatus = "PLANNED" | "ACTIVE" | ...`)
  must be kept in sync with the corresponding backend `Enum` in `app/models/*.py` by hand.
- **Lint with `npm run lint`**, typecheck with `npm run build` (the `tsc -b` step) before
  committing.

## Naming and structure that spans both sides

- REST paths are plural nouns (`/employees`, `/projects`, `/payroll`), nested resources use a
  sub-path (`/projects/{id}/assignments`, `/employees/{id}/documents`) — follow this when
  adding new resources. See [[Backend/API|Backend API]].
- Status/stage/type fields are always `SCREAMING_SNAKE_CASE` string enums on the wire, rendered
  through `lib/format.ts: label()`/`roleLabel()` on the frontend rather than a hardcoded
  display string per usage site.

## Related

[[AI Coding Conventions]] · [[Backend/Architecture|Backend Architecture]] ·
[[Frontend/UI Architecture|Frontend UI Architecture]] · [[Build & Run]] · [[Backend/Models|Backend Models]]
