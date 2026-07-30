# AGENTS.md

This repo is TechManion Portal: a FastAPI + PostgreSQL backend (`backend/`) and a React +
Vite + TypeScript frontend (`frontend/`), documented in the Obsidian vault under `docs/`.

## Read this first

**Before editing any code, read
[`docs/Development/AI Coding Conventions.md`](docs/Development/AI%20Coding%20Conventions.md).**
It is the canonical, binding rulebook for this codebase and includes a completion checklist
every change must satisfy before you consider it done. This file only summarizes the most
critical rules — it does not replace that document.

## Non-negotiable rules (see the conventions doc for the full list and rationale)

1. Never build a complete feature inside one page file — extract organisms/molecules.
2. Never add feature-specific UI or business logic directly to an atom.
3. Reuse an existing component, hook, or API function before creating a new one.
4. Frontend: pages compose; organisms implement sections; molecules combine primitives; atoms
   stay generic.
5. Backend: route files (`backend/app/api/routes/*.py`) must stay thin — parse the request,
   call a service/repository, return the response.
6. Business logic belongs in `backend/app/services/`, not in a route.
7. Don't duplicate a database query shape 3+ times across routes — put it in
   `backend/app/repositories/`.
8. Keep changes scoped to what was requested.
9. Don't delete an existing abstraction without checking why it exists first.
10. Don't introduce a new architectural pattern without a clear, stated need.
11. Preserve existing UI visual design and behavior unless the task is explicitly to change it.
12. Inspect the relevant doc under `docs/` for the area you're touching before implementing.
13. **Update the relevant docs under `docs/` in the same change** — see below. A change isn't
    done until the docs describing the thing you changed match reality.

## Docs are part of every change, not a follow-up

This repo's Obsidian vault (`docs/`) went stale multiple times because doc updates were treated
as optional/deferred. Don't repeat that. Whenever you change code, update the doc(s) that
describe it **in the same change** — same PR, same commit, same turn — not as a TODO for later:

- Changed a route's path/method/schema/auth → update [[Backend/API|Backend API]].
- Added/renamed/moved a model, table, or migration → update [[Backend/Models|Backend Models]],
  [[Database/Schema|Database Schema]], and the relevant per-domain `Database/*.md` page.
- Added/moved business logic → update [[Backend/Services|Backend Services]].
- Restructured backend packages (new `app/` subpackage, moved a file) → update
  [[Backend/Architecture|Backend Architecture]] and [[Folder Structure]].
- Added/renamed/moved a frontend component → update [[Frontend/Components|Frontend
  Components]].
- Added a page or changed routing/nav → update [[Frontend/Pages|Frontend Pages]] and
  [[Frontend/Routing|Frontend Routing]].
- Changed how data is fetched/stored client-side (a new `lib/api/*.ts` module, a new hook) →
  update [[Frontend/State Management|Frontend State Management]].
- Fixed or removed something previously listed as a gap → update
  [[Decisions/Known Limitations|Known Limitations]] (remove the resolved entry, don't leave it
  describing behavior that no longer exists).
- Changed user-facing behavior of a feature → update the matching `docs/Features/*.md` page.

If a change genuinely doesn't map to any doc, that's fine — but check first; assume it does.
Never leave a doc asserting something the code no longer does (a removed endpoint, a renamed
file, a fixed limitation) — a wrong doc is worse than no doc, because it actively misleads the
next agent who trusts it instead of reading the code.

## Where things live

- Backend: `backend/app/{models,schemas,services,repositories}/` (one module per domain) +
  `backend/app/api/routes/*.py` (thin route handlers) + `backend/app/api/router.py` (aggregator).
- Frontend: `frontend/src/components/{atoms,molecules,organisms}/`, `frontend/src/pages/`,
  `frontend/src/lib/api/<domain>.ts`, `frontend/src/lib/options.ts`, `frontend/src/hooks/`.
- Full architecture, database schema, and feature docs: `docs/Home.md` in the Obsidian vault.

## Verifying a change

- Backend: `cd backend && .venv/bin/python -m pytest` and `.venv/bin/python -m ruff check app`.
- Frontend: `cd frontend && npx tsc --noEmit -p tsconfig.app.json && npm run lint && npm run build`.
- For anything touching auth, hiring conversion, project assignment, payroll
  generation/payment, or the Home feed: exercise the flow directly (API call or through the
  UI), not just type-check/lint.
