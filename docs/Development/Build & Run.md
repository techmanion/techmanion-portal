---
tags: [development]
---

# Build & Run

## Backend (`backend/`, with `.venv` activated)

| Task | Command |
|---|---|
| Run dev server (auto-reload) | `uvicorn app.main:app --reload` |
| Apply migrations | `alembic upgrade head` |
| Create a new migration file | `alembic revision -m "description"` (then hand-write `upgrade()`/`downgrade()` — this repo's migrations call `Base.metadata.create_all`/explicit `op.drop_table`/`op.execute`, not autogenerate; see the files in `backend/alembic/versions/`) |
| Lint | `ruff check app/` |
| Run tests | `pytest` (from `backend/`; picks up `tests/conftest.py`'s `TEST_DATABASE_URL` override — see [[Environment]]) |

There is no `Makefile` or task runner — these are the raw commands.

## Frontend (`frontend/`)

From `package.json`:

| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `vite` | Dev server with HMR, default port `5173` |
| `npm run build` | `tsc -b && vite build` | Type-checks the whole project (`tsconfig.json` project references) **then** produces a production bundle in `dist/` |
| `npm run lint` | `eslint .` | Flat-config ESLint (`eslint.config.js`) — TypeScript + React Hooks + React Refresh rules |
| `npm run preview` | `vite preview` | Serves the built `dist/` locally to sanity-check a production build |

`npm run build` failing on the `tsc -b` step will also fail CI/deploys — it is a hard
typecheck gate before Vite even bundles.

## Running both together

Two separate processes, no supervisor script bundled:

```bash
# terminal 1
cd backend && source .venv/bin/activate && uvicorn app.main:app --reload

# terminal 2
cd frontend && npm run dev
```

Both must be running for the SPA to function — Vite serves static assets only; every data
operation is a `fetch` to the backend (see [[Frontend/State Management|Frontend State Management]]).

## Deployment

`vercel.json` (repo root) defines a two-service Vercel monorepo deploy — see
[[System Architecture]] for the routing rules. There is no other deployment config
(no Dockerfile, no CI workflow file) in the repository as of this writing.

## Related

[[Getting Started]] · [[Environment]] · [[System Architecture]] ·
[[Decisions/Known Limitations|Known Limitations]] (test coverage caveat)
