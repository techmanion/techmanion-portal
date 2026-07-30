---
tags: [development]
---

# Getting Started

## Prerequisites

- **Python 3.13** (backend uses a `backend/.venv` virtualenv)
- **Node.js** (React 19 / Vite 6 / TypeScript ~5.7 — Node 20+ recommended)
- **PostgreSQL** running locally (or reachable via `DATABASE_URL`)

## 1. Backend setup

```bash
cd backend
python3.13 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt

cp .env.example .env
# edit .env: at minimum set a real JWT_SECRET; DATABASE_URL defaults to a local
# techmanion/techmanion Postgres database — see Environment

alembic upgrade head
uvicorn app.main:app --reload
```

On first boot, `seed_defaults()` (see [[Backend/Architecture|Backend Architecture]]) creates:

- an admin login: `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD` from `.env`
  (defaults `admin@techmanion.com` / `ChangeMe123!` if unset — **change these for anything
  beyond local dev**)
- four departments and four designations to populate dropdowns immediately

API is now at `http://localhost:8000/api/v1`, docs at `http://localhost:8000/docs`.

## 2. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_URL, defaults to http://localhost:8000/api/v1
npm run dev
```

App is now at `http://localhost:5173`. Log in with the admin credentials above.

## 3. Verify

- `curl http://localhost:8000/health` → `{"status": "ok"}`
- Log into the frontend and confirm the sidebar shows Home/Hiring/Employees/Projects/Payroll,
  plus Team Members/Organization/Audit History (admin-only) — see [[Frontend/Routing|Frontend Routing]].

## Next

- [[Environment]] — every env var, what it does, where it's read
- [[Build & Run]] — every dev/build/lint/test/migration command
- [[Conventions]] — code style and patterns to follow when extending the app
- [[System Architecture]] — how the pieces fit together before you start changing things
