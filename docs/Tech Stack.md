---
tags: [reference]
---

# Tech Stack

## Backend — `backend/`

| Package | Version (pinned) | Purpose |
|---|---|---|
| `fastapi` | 0.115.6 | Web framework, routing, OpenAPI docs |
| `uvicorn[standard]` | 0.34.0 | ASGI server |
| `pydantic` | 2.10.4 | Request/response validation ([[Backend/API\|API]]) |
| `pydantic-settings` | 2.7.1 | Typed env-var configuration (`app/config.py`) |
| `sqlalchemy` | 2.0.36 | ORM ([[Backend/Models\|Models]]) — `Mapped[...]` declarative style |
| `alembic` | 1.14.0 | Schema migrations (`backend/alembic/`) |
| `psycopg[binary]` | 3.2.3 | PostgreSQL driver |
| `PyJWT[crypto]` | 2.10.1 | Signed access tokens |
| `passlib[bcrypt]` | 1.7.4 + `bcrypt` 4.0.1 | Password hashing |
| `python-multipart` | 0.0.20 | Multipart form parsing (document upload) |
| `email-validator` | 2.2.0 | `EmailStr` validation in Pydantic schemas |

Dev-only (`requirements-dev.txt`): `pytest` 8.3.4, `httpx` 0.28.1 (FastAPI `TestClient`),
`ruff` 0.8.6 (lint).

Language/runtime: **Python 3.13** (see `backend/.venv`).

## Frontend — `frontend/`

| Package | Version | Purpose |
|---|---|---|
| `react` / `react-dom` | ^19.0.0 | UI library |
| `react-router-dom` | ^7.18.1 | Client-side routing ([[Frontend/Routing\|Routing]]) |
| `vite` | ^6.0.5 | Dev server + bundler |
| `@vitejs/plugin-react` | ^4.3.4 | React fast refresh for Vite |
| `typescript` | ~5.7.2 | Static typing, `tsc -b` project build |
| `tailwindcss` + `@tailwindcss/vite` | ^4.3.3 | Utility CSS, compiled via the Vite plugin (no `tailwind.config.js` — v4 uses `@theme` in CSS) |
| `lucide-react` | ^0.468.0 | Icon set (declared as a dependency; the UI actually renders icons via the Material Symbols **web font**, see [[Frontend/UI Architecture\|UI Architecture]]) |
| `eslint` + `typescript-eslint` | ^10.8.0 / ^8.65.0 | Linting (`eslint.config.js`, flat config) |
| `eslint-plugin-react-hooks` / `-react-refresh` | latest | Hook-rule and fast-refresh linting |

No state-management library (Redux/Zustand/React Query) is used — see
[[Frontend/State Management|State Management]].

## Database

**PostgreSQL**, accessed only from the backend. Local dev connection string is set via
`DATABASE_URL` — see [[Environment]]. Schema is fully described in [[Database/Schema|Database Schema]].

## Fonts / icons

`frontend/index.html` loads Google Fonts (`Google Sans`, `Roboto`) and the **Material Symbols
Outlined** variable icon font, used everywhere via the `Icon` atom
(`frontend/src/components/atoms/Icon.tsx`, class `material-symbols-outlined`).

## Tooling summary

| Concern | Tool |
|---|---|
| Backend lint | `ruff check app/` |
| Backend tests | `pytest` (`backend/tests/`) |
| Backend migrations | `alembic upgrade head` |
| Frontend typecheck + build | `npm run build` (`tsc -b && vite build`) |
| Frontend lint | `npm run lint` |
| Frontend dev server | `npm run dev` (Vite, default port 5173) |
| Backend dev server | `uvicorn app.main:app --reload` (default port 8000) |

Full commands: [[Build & Run]].

## Related

[[System Architecture]] · [[Folder Structure]] · [[Backend/Architecture|Backend Architecture]] ·
[[Frontend/UI Architecture|Frontend UI Architecture]]
