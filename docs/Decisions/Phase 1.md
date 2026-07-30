---
tags: [decisions]
---

# Phase 1 — What Actually Shipped

The repository's `docs/` root carries a full pre-implementation planning set —
[[software-house-management-system-spec]], [[design-doc]], [[planning-doc]], [[architecture]],
[[data-model]], [[decisions]] — that scoped an original "v1" (their Phase 1). This page
reconciles that plan against **what the codebase contains today**, because the two have
diverged, most notably in Projects and Payroll.

## Where the shipped product matches the original plan

| Original decision ([[decisions]]) | Still true today? |
|---|---|
| D1 — Vite+React / FastAPI / PostgreSQL+SQLAlchemy | ✅ exactly this — see [[Tech Stack]] |
| D2 — Admin/HR only, no self-service | ✅ no `Employee`↔`User` link exists — see [[Database/Relationships\|Database Relationships]]. (The Team page does let you *create* `MANAGER`/`EMPLOYEE` login accounts, but they carry no extra permissions — see [[Backend/Authentication\|Backend Authentication]].) |
| D3 — Single-tenant, internal only | ✅ no tenant column anywhere |
| D6 — Home page is not a stats dashboard | ✅ true, but not for the planned reason — the shipped home page isn't the employee directory either; it's static placeholder panels. See [[Features/Home\|Features/Home]] |
| D8 — Trello stays a reference link only | ⚠️ superseded — the `trello_url` field itself was later removed entirely (see below) |

## Where it diverges: Projects and Payroll were simplified

A later change (migration `20260730_03_simplify_projects_payroll`) rebuilt both modules to be
smaller than the original plan. This was a deliberate simplification pass, not an
accumulation of technical debt — old tables were dropped outright rather than deprecated.

### Projects

| Original design ([[data-model]] §3) | Current implementation |
|---|---|
| `contractValue`, `currency` per project | **Removed.** No budget/contract value tracked at all. |
| `trelloUrl` per project | **Removed.** |
| `ProjectAssignment.projectRole` (free text) | **Removed.** An assignment is just "employee X is on project Y." |
| `ProjectAssignment.allocationPct` (0–100) | **Removed.** No capacity/allocation tracking. |
| `ProjectAssignment.startDate`/`endDate` | **Removed.** |
| `ProjectStatus`: `PLANNING, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED` | Renamed/reduced to `PLANNED, ACTIVE, ON_HOLD, COMPLETED` (no `CANCELLED`). |

See [[Database/Projects|Database Projects]] and [[Features/Projects|Features/Projects]].

### Payroll

| Original design ([[data-model]] §4, [[architecture]] §6) | Current implementation |
|---|---|
| `PayrollRun` (one per month, `DRAFT`/`COMPLETED`) → `Payslip` (per employee) → `PayslipLineItem` (earnings/deductions) | **Collapsed into one flat table**, `PayrollEntry` — see [[Database/Payroll\|Database Payroll]] |
| Pakistan tax-slab engine (`TaxSlab` table + `services.py` calculation) | **Removed entirely.** No tax computation anywhere. |
| `gross/tax/net` amount breakdown | **Removed.** Just `baseCompensation + adjustment = finalAmount`. |
| `paymentStatus`: `PENDING, PAID, PARTIALLY_PAID` + `paidAmount` | Reduced to `PENDING, PAID` — no partial payments. |
| Payslip immutable once run is `COMPLETED` | N/A — there is no run concept, and entries stay editable until deleted. |

See [[Database/Payroll|Database Payroll]] and [[Features/Payroll|Features/Payroll]].

### Settings

The Organization page's **Pakistan tax slabs** section and its backing `/settings/tax-slabs`
endpoints were removed along with the tax engine. The "Tax Configuration" sidebar entry
described in the original nav is gone.

## Net effect

The shipped Phase 1 is **simpler** than the originally-planned MVP in Projects and Payroll,
while Employees and Hiring largely match (or exceed — Hiring wasn't in the original v1 cut
described by [[planning-doc]] §2 as clearly, yet it's fully built). Anyone reading the legacy
`docs/` root files should treat Projects/Payroll sections there as **historical intent, not
current fact** — [[Database/Projects|Database Projects]], [[Database/Payroll|Database
Payroll]], and [[Backend/API|Backend API]] in this vault are the source of truth for what
exists now.

## Related

[[Future Roadmap]] · [[Known Limitations]] · [[Database/Schema|Database Schema]]
