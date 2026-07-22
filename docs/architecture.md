# Software House Management System — Architecture

**Version:** 1.0
**Companion to:** [Planning Document](planning-doc.md) · [Data Model](data-model.md)
**Scope:** v1 (MVP), single-tenant, internal

---

## 1. Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router)** | One codebase for UI + API; fastest path for an internal tool. |
| Language | TypeScript (strict) | Type safety across the data model, especially money and enums. |
| UI | React + **shadcn/ui** + Tailwind | Mandated by the [Design Document](design-doc.md); restyled to tokens. |
| Server logic | Server Actions + Route Handlers | Mutations via Server Actions; a thin REST surface for exports/files. |
| Database | **PostgreSQL** | Relational data (employees, payroll, assignments); strong integrity. |
| ORM | **Prisma** | Typed schema → matches [data-model.md](data-model.md); migrations. |
| Auth | Credentials + session (Auth.js/NextAuth) | Email + password for Admin/HR only in v1. |
| File storage | Object storage (S3-compatible) or local disk (dev) | Employee documents; DB stores metadata + key, not bytes. |
| Money | Integer minor units + currency code | Never floats. See [§5](#5-money-and-tax). |
| Deployment | Vercel or self-hosted Node + managed Postgres | Either works; pick per hosting preference. |

---

## 2. Application Structure

```
app/
  (auth)/login/           # centered 360px card — Design Document §3
  (app)/
    employees/            # directory (home), [id] detail with tabs
    payroll/              # month picker + run table, payslip print route
    projects/             # registry + [id] detail (members, allocation)
    settings/             # departments, roles, tax slabs, company profile
    layout.tsx            # 240px sidebar + 1200px centered content
  api/                    # route handlers: file upload/download, exports
lib/
  auth/                   # session, RBAC guards
  db/                     # prisma client
  money/                  # minor-units + currency helpers
  tax/                    # Pakistan slab engine (configurable)
  audit/                  # audit-log writer
components/ui/            # shadcn components restyled to design tokens
```

Page anatomy is identical everywhere (title → primary action → filters → card),
per [Design Document §2.3](design-doc.md).

---

## 3. Access Control (RBAC)

- Every mutation and sensitive read passes through a server-side guard — **never** trust the client.
- v1 roles: **Admin**, **HR**. Manager/Employee exist in the schema but have no login provisioned (see [planning-doc.md §4](planning-doc.md)).
- Salary data is the tightest boundary: guard reads, not just writes ([spec §6](software-house-management-system-spec.md) data-privacy).
- Role checks live in `lib/auth` and are called at the top of each Server Action / route handler.

---

## 4. Audit Trail

A single append-only `AuditLog` table records who/what/when for sensitive actions:

- Salary create/revision, payroll line-item edits, payment-status changes
- Employee status → Resigned / Terminated
- User/role changes

Each entry stores actor, action, entity type + id, before/after snapshot (JSON), and timestamp.
Written synchronously inside the same transaction as the change it records.

---

## 5. Money and Tax

- **Storage:** every monetary value is an integer in **minor units** (paisa/cents) plus a
  `currency` code (ISO 4217, default `PKR`). No floating-point money anywhere.
- **Display:** formatted right-aligned, tabular, with currency shown ([Design Document §4](design-doc.md)).
- **Tax:** Pakistan salary slabs live in a **configurable** table (`TaxSlab`), not hardcoded,
  so rates can change per fiscal year without a deploy. The slab engine (`lib/tax`) takes an
  annualized base and returns monthly withholding.
- **Multi-currency:** amounts are stored and shown in their own currency; v1 does **not**
  auto-convert between currencies (no FX rates) — that's a Phase 3 concern.

---

## 6. Non-Functional Requirements (from spec §6)

| Requirement | How v1 meets it |
|---|---|
| Authentication & security | Session auth, password policy, server-side RBAC guards |
| Data privacy | Salary reads role-gated; documents behind authenticated routes |
| Backup & recovery | Managed Postgres automated backups; documented restore |
| Scalability | Handles a few → 50+ employees without redesign; single Postgres |
| Multi-device | Responsive; tables scroll horizontally on mobile ([Design Document §4](design-doc.md)) |
| Audit trail | `AuditLog` table, see [§4](#4-audit-trail) |
| Email notifications | **Deferred to Phase 2** (payslip email, leave status) |

---

## 7. External Integrations

- **Trello:** reference link only — a stored URL per project. No API integration in v1 ([spec §4](software-house-management-system-spec.md)).
- **Accounting tools (QuickBooks, etc.):** out of scope; data model kept clean so exports can feed them later.

---

## 8. What This Architecture Deliberately Avoids

- No microservices, no separate API service — one Next.js app.
- No message queue, no caching layer — unnecessary at this scale.
- No multi-tenancy plumbing (single company, [decisions.md](decisions.md)).
- No client-side money math — all payroll calculation is server-side and audited.
