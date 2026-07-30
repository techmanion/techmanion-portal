---
tags: [development, conventions]
---

# AI Coding Conventions

> [!important] Read this before editing any code in this repository.
> This document is the **canonical, binding source of truth** for how code is organized and
> written in TechManion Portal. Every coding agent (human or AI) must read it before making
> changes and must satisfy the [Completion Checklist](#completion-checklist) before considering
> work done. Where this document and an older page under `docs/` disagree, **this document
> wins** — the older page is stale and should be corrected to match.
>
> See also [[Conventions]] for a shorter "patterns observed" quick reference, and
> [[Folder Structure]] for the literal file tree.

## 1. Non-negotiable rules

These are enforced in review. Do not violate them without discussing with the user first.

1. Never build a complete feature inside one page file. Extract organisms/molecules for
   anything beyond simple composition.
2. Never add feature-specific UI or business logic directly to an atom.
3. Reuse an existing component, hook, or API function before creating a new one. Search
   `components/`, `hooks/`, and `lib/api/` first.
4. Pages compose; organisms implement sections; molecules combine primitives; atoms stay
   generic. Never skip a layer by putting organism-sized JSX straight into a page without a
   named component around it.
5. Backend route files must stay thin: parse the request, resolve dependencies, call a
   service/repository, return the response. No multi-step business logic in a route body.
6. Business logic — validation beyond schema shape, multi-step writes, cross-entity rules —
   belongs in `app/services/`, not in a route.
7. Database query logic must not be copy-pasted across endpoints. If the same `select(...)`
   with the same `.options(...)` appears more than twice, put it in `app/repositories/`.
8. Keep changes scoped to what was requested. Don't refactor unrelated files "while you're in
   there."
9. Don't delete an existing component, hook, service function, or migration without first
   checking why it exists (grep its usages, read its git history) — an unused-looking helper
   may be intentional design-system surface, not dead code.
10. Don't introduce a new architectural pattern (a new state library, a new folder convention,
    a new abstraction layer) unless the existing pattern genuinely cannot express what you
    need. Check [[Conventions]] and this document for the existing pattern first.
11. Preserve existing UI visual design, spacing, and behavior during a structural refactor.
    A refactor that also changes what the user sees or how a form behaves is doing two things
    at once — split it into two changes, or get explicit sign-off.
12. Before implementing, inspect the relevant architecture doc(s) linked from [[Home]] for the
    area you're touching (e.g. [[Backend/API|Backend API]] before adding a route,
    [[Frontend/Components|Frontend Components]] before adding a component).
13. Update the relevant doc(s) under `docs/` in the same change — see
    [Documentation expectations](#16-documentation-expectations). Not a follow-up, not a TODO:
    part of the change.

## 2. Frontend: Atomic Design

Components live under `frontend/src/components/{atoms,molecules,organisms}/`, each with a
barrel `index.ts`. There is no `features/` folder — this codebase's page count and team size
don't justify per-feature folders splitting api/components/hooks/types four ways; the flatter
`components/` + `pages/` + `lib/api/` + `hooks/` structure already gives every piece one
obvious home. Don't introduce `features/` without a concrete reason it's needed.

### Atoms
Small, generic, visual-only primitives with **no feature-specific business logic** and no
knowledge of any domain entity (`Employee`, `Project`, etc.). Examples already in the codebase:
`Button`, `Input`, `Select`, `Textarea`, `IconButton`, `Icon`, `Avatar`, `Badge`/`StatusChip`,
`Loading`, `Logo`, `Typography` (`PageTitle`, `SectionHeading`, `Eyebrow`).

An atom takes primitive props (`value`, `onChange`, `variant`, `size`, `className`) and renders
one DOM element or a very small cluster. If a component needs to import a `types.ts` domain
type, it is not an atom.

### Molecules
Small reusable combinations of atoms, still domain-light but allowed to know about a narrow
shape of data. Examples: `FormField`, `SearchInput`, `FilterSelect`, `EmptyState`,
`TableActionMenu`, `EmployeeCell`, `MoneyInput` (wraps `Input` for minor-unit currency
amounts), `EmployeeAssignSelect` (a `<select>` for assigning an employee, reused by the
projects list and project detail team panel), `PageHeaderActions`, `UserMenu`.

### Organisms
Larger, feature-sized sections — usually a whole table, a whole inline form panel, or a whole
dashboard panel. Examples: `EmployeeTable`, `JobsTable`, `CandidatesTable`, `ProjectsTable`,
`PayrollTable`, `JobFormPanel`, `CandidateFormPanel`, `ConvertCandidateFormPanel`,
`ProjectFormPanel`, `PayrollEntryFormPanel`, `ProjectInfoPanel`, `ProjectTeamPanel`,
`EmployeeOverviewPanel`, `CompensationPanel`, `DocumentsPanel`, `QuickActionsPanel`,
`UpcomingItemsPanel`, `ActivityFeed`, `AppShell`, `Sidebar`, `PageHeader`.

An organism owns its own internal layout/markup for a section and takes callback props
(`onEdit`, `onDelete`, `onSubmit`, ...) — it does not fetch data itself. Data fetching stays in
the page.

### Pages
Pages (`frontend/src/pages/*.tsx`) may only:
- Fetch page-level data (directly, or via a `hooks/use*.ts` data hook for pages coordinating
  more than ~2 related entities — see `hooks/useHiringData.ts`).
- Hold routing/top-level UI state (which tab is active, which form is open, which row is being
  edited).
- Compose organisms/molecules and wire callbacks between them.

Pages must **not** contain: a full inline `<form>` of more than a couple of fields (extract a
`*FormPanel` organism), a full `<table>` body (extract a `*Table` organism), a second
full-featured component defined inline in the same file, or business logic beyond simple
client-side filtering (`.filter()`/`.reduce()` on already-fetched data is fine; anything that
talks to money rounding, cross-entity rules, etc. belongs server-side in a service).

## 3. Frontend: feature-adjacent conventions

- **API calls**: never call `fetch` or the raw `api()` client from inside a component or page
  body for a named resource. Add/extend a function in `lib/api/<domain>.ts`
  (`employees.ts`, `projects.ts`, `payroll.ts`, `hiring.ts`, `home.ts`, `settings.ts`,
  `users.ts`, `auth.ts`) and import that. `lib/api/client.ts` holds only the transport-level
  `api()`/`apiBlob()`/`ApiError` primitives; `lib/api/index.ts` re-exports everything so
  `import { x } from "../lib/api"` keeps working, but prefer importing from the specific
  domain module when practical.
- **Constants/enums**: shared option lists (status values, roles, employment types, document
  kinds) live in `lib/options.ts`, not copy-pasted as inline arrays in each page.
- **Hooks**: a `useXyz` hook goes in `hooks/`. Only extract one when it removes real
  duplication (`useDebouncedValue`) or meaningfully shrinks an oversized page's data layer
  (`useHiringData`) — don't wrap a single `useState` in a hook for its own sake.
- **Types**: `frontend/src/types.ts` is the single source of frontend domain types, hand-kept
  in sync with the backend's Pydantic schemas (camelCase, since the wire format is
  camelCase). Don't fork a parallel type definition in a component file.

## 4. Backend: route / service / repository / model / schema boundaries

```
backend/app/
  main.py            FastAPI app, CORS, startup seed
  config.py           Settings
  database.py          Base, engine, session
  security.py          password hashing, JWT
  core/
    errors.py           get_or_404() — the one shared "fetch or 404" helper
  api/
    __init__.py          exposes `router`
    router.py            aggregates all route modules
    dependencies.py       DbSession / CurrentUser / AdminUser
    routes/
      auth.py, employees.py, hiring.py, projects.py, payroll.py, home.py, settings.py
  models/               one module per domain + __init__.py re-exporting everything
  schemas/              one module per domain + __init__.py re-exporting everything
  services/             one module per domain + __init__.py re-exporting the public API
  repositories/         one module per domain, only for genuinely-repeated eager-loaded queries
```

### Routes (`app/api/routes/*.py`)
A route function may: parse the request (path/query params, request body via a Pydantic
schema), depend on `DbSession`/`CurrentUser`/`AdminUser`, call **one or two** service or
repository functions, and return a response (often via a small `serialize_x()` mapper function
defined at the top of the same route module, mapping an ORM row to its `*Out` schema). A route
must not contain a multi-statement business transaction, a loop building up related rows, or
duplicate error-handling logic that a service already owns.

### Services (`app/services/*.py`)
Business rules live here: candidate→employee conversion (`services/hiring.py`), payroll
generation and the month-end-date rule (`services/payroll.py`), project assignment
(`services/projects.py`), the Home "needs attention"/upcoming feed (`services/home.py`),
employee creation bundling the initial salary revision (`services/employees.py`), and activity
logging (`services/activity.py`). A service function owns its own `db.commit()`/`db.rollback()`
and may raise `HTTPException` directly for an expected business-rule violation (a duplicate
email, an already-converted candidate) — that exception is the business rule, not a transport
detail, so it's fine for it to live here rather than being translated by the route.

### Repositories (`app/repositories/*.py`)
Only for a `select(...)` + `.options(selectinload(...))` shape that is reused **3+ times**
across routes (e.g. `get_employee_detailed`, `get_project_detailed`,
`get_payroll_entry_detailed`, `get_candidate_detailed`). Do not add a repository function that
wraps a single trivial `db.get(Model, id)` call used once — call `db.get()` or
`core/errors.get_or_404()` directly in that case.

### Models (`app/models/*.py`)
Split by domain (`auth.py`, `organization.py`, `employees.py`, `hiring.py`, `projects.py`,
`payroll.py`, `activity.py`), each importing only the domain modules it has a real foreign
key/relationship to (e.g. `projects.py` imports `Employee` from `employees.py`). Never
introduce a circular import between two model modules — if you need one, the entity boundary
is probably wrong. `models/__init__.py` re-exports every public name so `from app.models import
X` keeps working everywhere else (routes, schemas, services, tests, Alembic's `env.py`).

### Schemas (`app/schemas/*.py`)
Same per-domain split as models. Every schema inherits `ApiModel`
(`schemas/common.py`) which sets `alias_generator=to_camel, populate_by_name=True,
from_attributes=True` — write fields in `snake_case`, the camelCase JSON conversion is
automatic. Never hand-roll a camelCase field name.

## 5. File-size guidance

- Prefer backend files under ~250–350 lines; the largest route file today
  (`api/routes/hiring.py`) is ~160 lines. If a route file is creeping past ~250 lines, it's a
  sign a service/repository extraction is overdue.
- Prefer frontend page files under ~250–300 lines; prefer components (atoms/molecules/organisms)
  under ~150 lines. A page in the 250–320 range is acceptable if it's genuinely coordinating
  several sub-resources on tabs (see `hiring.tsx`) — don't force an artificial split that adds
  a hook or component used by only that one page for no readability gain.
- These are guidelines, not hard gates. Judgement beats a line count: a 320-line page that
  reads as one coherent flow is better than a 200-line page plus three single-use wrapper
  files that only exist to dodge the number.

## 6. Reuse-before-create

Before adding a new component, hook, API function, or schema:
1. Grep `components/atoms`, `components/molecules`, `components/organisms` for a component that
   already does this (or 90% of this — extend it with a prop rather than forking it).
2. Grep `lib/api/` for an existing function hitting the same endpoint.
3. Grep `lib/options.ts` for an existing constant array before inlining a new one.
4. Only create new abstractions that are used more than once, **unless** the abstraction
   materially improves readability of a single oversized call site (e.g. `useHiringData`,
   which exists purely to shrink `hiring.tsx`, is fine even though only one page uses it).

## 7. Naming conventions

- **Backend**: `snake_case` for functions/variables/fields, `PascalCase` for
  classes/models/schemas, route path segments are plural nouns (`/employees`, `/projects`).
  Service functions read as verbs (`create_employee`, `convert_candidate_to_employee`,
  `generate_payroll_for_month`). Repository functions are named `get_<entity>_detailed`.
- **Frontend**: `PascalCase` for components and their files (`ProjectsTable.tsx`), `camelCase`
  for functions/variables/hooks (`useDebouncedValue`), hook files start with `use`. API module
  functions read as verbs matching their HTTP semantics (`listProjects`, `getProject`,
  `createProject`, `updateProject`, `deleteProject`, `assignEmployeeToProject`).
- When a route function name and an imported service function would collide (both legitimately
  called e.g. `create_employee`), alias the **service** import at the call site
  (`create_employee as create_employee_service` in Python, `createEmployee as
  createEmployeeRequest`-style in TS only if needed) rather than renaming the public route
  or the public service function.

## 8. Import conventions

- Frontend: relative imports only, no path aliases (`../components/atoms`, `../lib/api`, not
  `@/components`).
- Frontend: import from a domain barrel (`../components/organisms`, `../lib/api`) for normal
  usage; import a single file directly (`../lib/api/employees`) when you specifically want to
  avoid the barrel's chance of name collisions, or when working inside `lib/api/` itself.
- Backend: import from the package root (`from app.models import Employee`) in routes/services/
  tests; import from the specific submodule (`from app.models.employees import Employee`) only
  from *within* another `models/`, `schemas/`, or `services/` submodule, to keep the dependency
  direction from package-root outward clear.
- Never import a route module from another route module except for a shared `serialize_x()`
  mapper (e.g. `hiring.py` imports `serialize_employee` from `employees.py` for the convert
  endpoint) — don't import route *handlers* cross-module.

## 9. API organization

- REST paths are plural nouns; nested resources use a sub-path
  (`/projects/{id}/assignments`, `/employees/{id}/documents`, `/candidates/{id}/convert`).
- One `APIRouter()` per domain in `api/routes/`, aggregated in `api/router.py`. Add a new
  domain by adding a new `routes/<domain>.py` + one `include_router()` line, never by growing
  an existing domain's router with an unrelated resource.
- Every list/get/create/update/delete for one entity lives in the same route module as that
  entity's other endpoints, even if the underlying table technically belongs to another
  domain's model file (e.g. document upload/download lives in `routes/employees.py` since it's
  reached through `/employees/{id}/documents`).

## 10. Error-handling conventions

- Backend: a missing row is a `404` via `core.errors.get_or_404()` (single-row-by-id case) or
  an inline `if not row: raise HTTPException(404, "...")` (when the row was already fetched
  with extra `.options()` via a repository function, so `get_or_404` doesn't fit). A business
  rule violation is a `409` (duplicate/conflicting state) or `400` (invalid transition) raised
  from the service. Always give a short human-readable `detail` string ending in a period.
- Backend: any write that could violate a unique constraint is wrapped
  `try: db.flush()/db.commit() except IntegrityError: db.rollback(); raise HTTPException(409,
  ...)`. Never let a raw `IntegrityError` reach the client as a 500.
- Frontend: every mutating call site (`onSubmit`, button `onClick`) is wrapped in `try/catch`
  setting a page-local `error` string state, rendered as a small `bg-error/10` banner — this is
  the only error UI pattern in the app. Don't introduce a toast library or a global error
  boundary for form errors.

## 11. Form conventions

- A create/edit form is an inline `surface-panel` block toggled by page state
  (`showForm`/`editingId`), not a modal/dialog — this app has **no modal dialog component**;
  don't add one for a form. See [[Frontend/Components|Frontend Components]].
- Wrap every field in the `FormField` molecule (`label`, optional `hint`, children).
- A money amount stored in minor units uses the `MoneyInput` molecule (handles the
  `/100` display, `*100` + `Math.round` submit conversion) rather than a bare `Input` with
  manual conversion inline. A month-only or already-major-unit numeric field (see `payroll.tsx`'s
  base compensation/adjustment fields, which the backend also expects pre-converted from a
  form string) can stay a plain `Input`.
- Confirmation for a destructive action (delete) is the browser's native `window.confirm(...)`
  — this app has no custom confirm dialog. Keep using `window.confirm` for parity unless the
  user asks for a custom one.

## 12. Table conventions

- A table is `DataTable` + `TableHeadRow` + `TableRow` (from `components/organisms/DataTable`),
  not a hand-rolled `<table>`. Row actions use `IconButton`/`TableActionMenu`.
- A table organism (`XTable`) receives already-filtered/already-fetched rows as a prop and
  callback props for row actions; it does not fetch or filter data itself. Loading/empty-state
  handling stays in the page (`{loading ? <Loading/> : rows.length ? <XTable .../> :
  <EmptyState>...}`), matching the existing `EmployeeTable` usage in `employees.tsx`.

## 13. Modal/dialog conventions

There is currently no modal/dialog component in this codebase — every "modal-like" interaction
is either an inline form panel (toggled visibility within the page flow) or a native
`window.confirm()`. If a future feature genuinely needs an overlay dialog, introduce one
reusable `Dialog`/`ConfirmDialog` molecule rather than a bespoke one-off overlay per page, and
update this section once it exists.

## 14. State-management conventions

- No global state library (no Redux/Zustand/React Query). Cross-cutting state is a small
  `Context` (`auth.tsx` → `useAuth()`, `theme.tsx` → `useTheme()`). Everything else is
  page-local `useState`/`useEffect` calling a `lib/api/*` function, following the existing
  `load()`-function-plus-`useEffect` pattern.
- Don't add a new Context for state that's only used by one page's subtree — lift it only as
  far as the pages that actually need it.

## 15. Database transaction conventions

- One logical business operation = one `db.commit()`. Multi-step writes (create employee +
  initial salary revision + activity log; convert candidate + create employee + salary revision
  + two activity logs) `db.flush()` between dependent inserts (to get generated IDs) and
  `db.commit()` once at the end, inside a single `try/except IntegrityError` block that
  `db.rollback()`s on failure.
- Read-modify-write on an already-loaded ORM object (e.g. marking payroll paid) does not need
  an explicit `db.flush()` — mutate the attributes, then `db.commit()`.
- Never split one conceptual operation across two separate route calls/commits when it can be
  one service function with one commit — that's how partial-failure states leak in.

## 16. Documentation expectations

**Update the relevant docs under `docs/` in every change, not as a deferred follow-up.** This
vault has gone stale multiple times (an `AuditLog`→`ActivityLog` rename, a Home page that went
from static placeholder to real data, an employee-detail page that shrank from 6 tabs to 3 —
none of it reflected in the docs until a dedicated cleanup pass) because doc updates were left
as an afterthought. Treat a doc update as part of the change itself:

- Changed a route's path, method, schema shape, or auth requirement → update
  [[Backend/API|Backend API]].
- Added/renamed/moved a model, table, or migration → update [[Backend/Models|Backend Models]],
  [[Database/Schema|Database Schema]], and the corresponding per-domain database page.
- Moved or added business logic → update [[Backend/Services|Backend Services]].
- Restructured backend packages → update [[Backend/Architecture|Backend Architecture]] and
  [[Folder Structure]].
- Added/renamed/moved a frontend component → update [[Frontend/Components|Frontend
  Components]].
- Added a page or changed routing/nav → update [[Frontend/Pages|Frontend Pages]] and
  [[Frontend/Routing|Frontend Routing]].
- Changed the client data-fetching layer (a `lib/api/*.ts` module, a hook) → update
  [[Frontend/State Management|Frontend State Management]].
- Fixed or removed something previously listed as a gap → update
  [[Decisions/Known Limitations|Known Limitations]] (delete the resolved entry — don't leave it
  describing behavior that no longer exists).
- Changed a feature's user-facing behavior → update the matching `docs/Features/*.md` page.
- There is no "leave a TODO for later" option for doc updates — if the change is in scope for
  this turn, the doc update is too. A wrong doc actively misleads the next agent who trusts it
  instead of reading the code; that is worse than no doc at all.

## Completion checklist

Before you consider a change to this codebase finished, confirm:

- [ ] You searched for an existing component/hook/API function before adding a new one.
- [ ] No page file contains a full inline table or a full inline form of more than a couple of
      fields — those are extracted into organisms.
- [ ] No backend route function contains more than a couple of statements of business logic —
      that logic is in `services/`.
- [ ] No `select(...)` + `.options(...)` query shape is duplicated 3+ times across routes
      without being pulled into `repositories/`.
- [ ] `ruff check app` (backend) and `npm run lint` + `npx tsc --noEmit` / `npm run build`
      (frontend) all pass.
- [ ] Existing tests still pass (`pytest` in `backend/`); you did not delete or weaken a test
      to make it pass.
- [ ] You did not change visual design, spacing, or existing business behavior beyond what the
      task required.
- [ ] You updated every relevant doc under `docs/` per [Documentation
      expectations](#16-documentation-expectations) — in this change, not deferred.
- [ ] If you touched auth, hiring conversion, project assignment, payroll generation/payment,
      or the Home feed, you manually exercised that flow (via the API directly or through the
      UI) rather than relying on types/lint alone.

## Related

[[Conventions]] · [[Folder Structure]] · [[Backend/Architecture|Backend Architecture]] ·
[[Frontend/UI Architecture|Frontend UI Architecture]] · [[Home]]
