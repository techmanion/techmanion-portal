# Software House Management System — Architecture

**Version:** 2.0
**Companion to:** [Planning Document](planning-doc.md) · [Data Model](data-model.md)
**Scope:** v1 (MVP), single-tenant, internal

---

## 1. Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Vite + React** single-page application | Fast local development, a small production bundle, and a clean separation from server concerns. |
| Frontend language | TypeScript (strict) | Type safety across API contracts, money values, and enums. |
| UI | React component primitives + design-token CSS | Implements the [Design Document](design-doc.md) without coupling the interface to the API runtime. |
| Backend | **FastAPI** on Python 3.13 | Typed REST endpoints, automatic OpenAPI documentation, explicit dependency-based authorization, and strong validation. |
| Database | **PostgreSQL** | Relational data (employees, payroll, assignments); strong integrity. |
| ORM / migrations | **SQLAlchemy 2 + Alembic** | Explicit relational mappings matching [data-model.md](data-model.md) with versioned migrations. |
| Validation | **Pydantic 2** | Validates API input/output at the server boundary and drives the OpenAPI schema. |
| Auth | Credentials + signed bearer tokens | Email + password for Admin/HR only in v1; FastAPI dependencies enforce RBAC. |
| File storage | Object storage (S3-compatible) or local disk (dev) | Employee documents; DB stores metadata + key, not bytes. |
| Money | Integer minor units + currency code | Never floats. See [§6](#6-money-and-tax). |
| Deployment | Static frontend + ASGI API + managed Postgres | The Vite build and FastAPI service deploy independently; hosting is environment-specific. |

---

## 2. Application Structure

```text
frontend/
  src/
    pages/                # login, employees, payroll, projects, settings
    components/           # app shell and reusable UI primitives
    lib/                  # typed API client and formatting helpers
    auth.tsx              # browser auth state; no authorization decisions
  vite.config.ts
backend/
  app/
    api.py                # versioned REST endpoints
    models.py             # SQLAlchemy model mapped to data-model.md
    schemas.py            # Pydantic request/response contracts
    dependencies.py       # authentication and RBAC dependencies
    services.py           # money, tax, and audit application logic
    database.py           # engine and per-request session
    main.py               # FastAPI app, CORS, and startup
  alembic/                # database migrations
  tests/                  # API and calculation tests
```

Page anatomy is identical everywhere (title → primary action → filters → card),
per [Design Document §2.3](design-doc.md).

---

## 3. Runtime Boundaries and API

- The browser calls a versioned JSON API under `/api/v1`; file downloads use authenticated
  API routes.
- FastAPI is the only process allowed to read or write PostgreSQL or file storage.
- Pydantic schemas validate requests before application logic runs and restrict response
  fields so password hashes and internal storage keys never leave the API.
- SQLAlchemy sessions are scoped to a request. Sensitive writes and their `AuditLog`
  record commit in the same database transaction.
- Frontend and backend configuration are intentionally separate. Vite reads
  `frontend/.env` (`VITE_API_URL`), while FastAPI reads `backend/.env`
  (`DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, and server-only settings).

---

## 4. Access Control (RBAC)

- Every mutation and sensitive read passes through a server-side guard — **never** trust the client.
- v1 roles: **Admin**, **HR**. Manager/Employee exist in the schema but have no login provisioned (see [planning-doc.md §4](planning-doc.md)).
- Salary data is the tightest boundary: guard reads, not just writes ([spec §6](software-house-management-system-spec.md) data-privacy).
- Role checks are FastAPI dependencies in `backend/app/dependencies.py` and run before
  the endpoint handler. UI role checks only hide unavailable actions; they are not a
  security boundary.
- Passwords are stored only as adaptive hashes. Signed access tokens are short-lived
  credentials and must be sent only over HTTPS outside local development.

---

## 5. Audit Trail

A single append-only `AuditLog` table records who/what/when for sensitive actions:

- Salary create/revision, payroll line-item edits, payment-status changes
- Employee status → Resigned / Terminated
- User/role changes

Each entry stores actor, action, entity type + id, before/after snapshot (JSON), and timestamp.
Written synchronously inside the same transaction as the change it records.

---

## 6. Money and Tax

- **Storage:** every monetary value is an integer in **minor units** (paisa/cents) plus a
  `currency` code (ISO 4217, default `PKR`). No floating-point money anywhere.
- **Display:** formatted right-aligned, tabular, with currency shown ([Design Document §4](design-doc.md)).
- **Tax:** Pakistan salary slabs live in a **configurable** table (`TaxSlab`), not hardcoded,
  so rates can change per fiscal year without a deploy. The slab engine
  (`backend/app/services.py`) takes an annualized base and returns monthly withholding.
- **Multi-currency:** amounts are stored and shown in their own currency; v1 does **not**
  auto-convert between currencies (no FX rates) — that's a Phase 3 concern.

---

## 7. Non-Functional Requirements (from spec §6)

| Requirement | How v1 meets it |
|---|---|
| Authentication & security | Signed-token auth, password policy, FastAPI RBAC dependencies |
| Data privacy | Salary reads role-gated; documents behind authenticated API routes |
| Backup & recovery | Managed Postgres automated backups; documented restore |
| Scalability | Stateless API replicas and static frontend; single Postgres handles a few → 50+ employees without redesign |
| Multi-device | Responsive; tables scroll horizontally on mobile ([Design Document §4](design-doc.md)) |
| Audit trail | `AuditLog` table, see [§5](#5-audit-trail) |
| Email notifications | **Deferred to Phase 2** (payslip email, leave status) |

---

## 8. Local Development and Deployment

- Run Vite and Uvicorn as separate development processes. Vite provides
  hot module replacement; Uvicorn reloads the Python API.
- Apply Alembic migrations before starting the API. PostgreSQL runs as a separately
  managed service configured through `DATABASE_URL`.
- Production should serve the Vite `dist/` directory from a static host and run FastAPI
  with an ASGI process manager. Keep PostgreSQL private, set a strong `JWT_SECRET`,
  restrict `FRONTEND_URL`, and use managed object storage for documents.
- Deployment wiring belongs to the target hosting environment and is not bundled with
  the application.
- FastAPI exposes OpenAPI documentation at `/docs`; `/health` is the service health
  endpoint.

---

## 9. External Integrations

- **Trello:** reference link only — a stored URL per project. No API integration in v1 ([spec §4](software-house-management-system-spec.md)).
- **Accounting tools (QuickBooks, etc.):** out of scope; data model kept clean so exports can feed them later.

---

## 10. What This Architecture Deliberately Avoids

- No microservices: the frontend and backend are separate deployment units, but all
  business capabilities remain in one modular FastAPI service.
- No message queue, no caching layer — unnecessary at this scale.
- No multi-tenancy plumbing (single company, [decisions.md](decisions.md)).
- No client-side money math — all payroll calculation is server-side and audited.
