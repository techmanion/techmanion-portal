# Software House Management System — Decisions Log

**Version:** 1.0
A short record of the choices that shape v1, and *why*. When a decision is revisited,
add a new entry rather than editing the old one.

---

### D1 — Stack: Next.js full-stack + PostgreSQL + Prisma
**Decision:** One Next.js (App Router) app for UI and server logic; PostgreSQL via Prisma.
**Why:** Internal tool, small team, one codebase is fastest to build and operate. The
[Design Document](design-doc.md) already mandates React + shadcn/ui, so Next.js is a
natural fit. Relational data (employees, payroll, assignments) wants Postgres.
**Rejected:** Separate React SPA + Node API (more moving parts than needed);
Supabase-backed (fine, but we preferred owning the server logic in one place).

### D2 — v1 is Admin/HR only; no employee self-service
**Decision:** Only Admin and HR log in for v1. Employee/Manager self-service is Phase 2+.
**Why:** Matches the [Design Document §1](design-doc.md) framing as an internal admin tool
used a few times a week. Self-service multiplies screens and RBAC surface; not needed to
be useful on day one.
**Consequence:** `User.role` still includes `MANAGER`/`EMPLOYEE` so the schema doesn't
change later, but no such logins are provisioned.

### D3 — Single-tenant, internal only
**Decision:** Build for one company. No multi-tenancy.
**Why:** Not a product for resale (spec §8 question resolved). Multi-tenancy adds
isolation, per-tenant config, and auth complexity for zero v1 value.
**Consequence:** No `tenantId` columns. If the direction ever changes, this is a known,
scoped rework — not a hidden assumption.

### D4 — Currency: PKR default, currency stored per value; no auto-conversion in v1
**Decision:** Every money field is integer **minor units** + an ISO currency code,
default `PKR`. International contractors can be paid in their own currency. No FX/auto
conversion in v1.
**Why:** Supports international clients/contractors (spec §8) without floating-point
money bugs. Cross-currency reporting (needs FX rates) is a Phase 3 concern.

### D5 — Tax: Pakistan slabs, configurable in a table
**Decision:** Salary tax uses Pakistan slabs stored in a `TaxSlab` table editable in
Settings, resolved by a server-side engine.
**Why:** Slabs change per fiscal year; hardcoding them means a deploy every budget.
Applies to fixed-salary staff in v1.

### D6 — v1 home is the employee directory, not a dashboard
**Decision:** No stat cards / charts on the home page in v1.
**Why:** Directly from [Design Document §5](design-doc.md) ("What We Deliberately Reject").
Reporting/analytics is Phase 3.

### D7 — Payroll math is server-side and audited; money never floats
**Decision:** All gross/tax/net computation happens on the server; every salary change and
payment-status change writes to `AuditLog`.
**Why:** [spec §6](software-house-management-system-spec.md) data-privacy and audit-trail
requirements. Client-computed pay is neither trustworthy nor auditable.

### D8 — Trello stays a reference link
**Decision:** Store a Trello board URL per project; no API integration.
**Why:** Task-level management explicitly stays in Trello (spec §4). Deep integration is
unjustified for v1.

---

## Document Map

| Document | Purpose |
|---|---|
| [software-house-management-system-spec.md](software-house-management-system-spec.md) | Full feature universe & phases (source) |
| [design-doc.md](design-doc.md) | Visual language & design critique |
| [planning-doc.md](planning-doc.md) | v1 scope: what's in, what's out, phasing |
| [architecture.md](architecture.md) | Stack, structure, RBAC, money/tax, NFRs |
| [data-model.md](data-model.md) | Entities, enums, relationships, integrity rules |
| decisions.md | This log — the *why* behind the above |
