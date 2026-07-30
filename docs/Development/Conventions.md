---
tags: [development]
---

# Conventions

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
  `user: CurrentUser` or `user: AdminUser` (from `dependencies.py`) rather than checking
  `user.role` manually inside the function body. See [[Backend/Authentication|Backend Authentication]].
- **Audit-worthy mutations call `audit(db, user, "resource.action", "EntityType", id,
  before=..., after=...)`** in the same function, before `db.commit()`, so the log entry and
  the change land in one transaction. See [[Backend/Services|Backend Services]] for the full
  list of existing action strings — reuse the `resource.verb` naming pattern for new ones.
- **Unique-constraint violations are caught explicitly**: wrap the `db.flush()`/`db.commit()`
  that could violate a unique constraint in `try/except IntegrityError`, `db.rollback()`, then
  raise `HTTPException(409, "<human message>.")`. This repeats in every create/update endpoint
  that touches a unique column — follow the existing examples in `api.py` rather than letting
  a raw 500 escape.
- **No repository/service-class layer** — `api.py` handlers call SQLAlchemy directly.
  `services.py` is reserved for logic genuinely shared across multiple endpoints (see
  [[Backend/Services|Backend Services]]), not a place to move every handler's body.
- **Lint with `ruff check app/`** before committing; the project has no `black`/`isort` config
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
  `auth.tsx`, `theme.tsx`); everything else is page-local `useState`/`useEffect` calling
  `lib/api.ts: api()` directly. Don't introduce Redux/Zustand/React Query for a single page's
  data — follow the existing per-page `load()` pattern in [[Frontend/State Management|Frontend State Management]].
- **Money round-trips through `formatMoney`/`* 100` by hand** at each form — there is no shared
  "money input" component. Follow the existing pattern: display divides by 100
  (`lib/format.ts: formatMoney`), submit multiplies by 100 and rounds
  (`Math.round(Number(value) * 100)`).
- **Enum-like unions in `types.ts`** (e.g. `type ProjectStatus = "PLANNED" | "ACTIVE" | ...`)
  must be kept in sync with the corresponding backend `Enum` in `models.py` by hand.
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

[[Backend/Architecture|Backend Architecture]] · [[Frontend/UI Architecture|Frontend UI Architecture]] ·
[[Build & Run]] · [[Backend/Models|Backend Models]]
