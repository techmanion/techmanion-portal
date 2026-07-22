# Software House Management System — Planning Document (MVP)

**Version:** 1.0
**Companion to:** [Specification](software-house-management-system-spec.md) · [Design Document](design-doc.md)
**Status:** Approved scope for v1

This is the document the [Design Document](design-doc.md) refers to. The spec lists
*everything the system could ever do*; this document decides *what v1 actually is*,
what it deliberately leaves out, and in what order the rest arrives.

---

## 1. What v1 Is

A single-tenant, internal admin tool for one software house. **Admin and HR are the
only users in v1** — there is no employee self-service login yet. It does one job
well: let an admin find, read, and edit records for **people, pay, and project
assignment** with zero friction (see [Design Document §1](design-doc.md)).

Task-level project work stays in Trello. This system is the business/admin layer
around it.

### Locked decisions (see [decisions.md](decisions.md) for rationale)

| Decision | Choice |
|---|---|
| Stack | Next.js (App Router) full-stack + PostgreSQL + Prisma |
| Users in v1 | Admin, HR only — no employee self-service |
| Tenancy | Single-tenant (one company) |
| Currency | PKR default, every money value carries a currency code |
| Tax | Pakistan salary tax slabs, configurable |

---

## 2. MVP Scope (Phase 1)

The cut below maps to the spec's **Phase 1** plus the minimum payroll needed to be
useful. Everything here ships in v1; anything not listed is Phase 2+.

### 2.1 Employees — IN
- Add / edit employee profile: personal info, CNIC/ID, contact, address, emergency contact
- Employee type: Full-time, Part-time, Contract/Freelance
- Role/designation and department/team (from a configurable list)
- Joining date, probation period, confirmation date
- Employee status: **Active, On Leave, Resigned, Terminated**
- Directory: searchable, filterable by role / team / status ([Design Document §3](design-doc.md))
- Document upload per employee (CV, contract, ID copies) — stored files, no e-signing
- Manual log entry for "company email / Trello access issued" (a note, not an integration)

### 2.2 Salary — IN
- **Fixed monthly salary** per employee (base salary + currency)
- Monthly payroll run: pick a month → table of active employees → editable line items inline
- Deductions & additions: tax (auto from slabs), plus manual bonus / advance / other
- Pakistan tax withholding (configurable slabs) applied to fixed-salary staff
- Payment status per employee per month: **Pending, Paid, Partially Paid**
- Payslip: print-optimized page (see [Design Document §3](design-doc.md)), black-on-white
- Bank/payment details stored per employee
- Salary revision history (effective-dated changes)

### 2.3 Projects — IN
- Project/Client registry: name, client name, start/end date, status, budget/contract value
- Project status: **Planning, In Progress, On Hold, Completed, Cancelled**
- Assign employees to projects (many-to-many)
- Role per project + allocation percentage
- Link Trello board URL (reference only)

### 2.4 Foundations — IN
- Secure login for Admin/HR, password policy, session handling
- Role-based access (Admin vs HR — see [§4](#4-roles-in-v1))
- Audit log for sensitive actions: salary changes, status changes to Resigned/Terminated
- Responsive layout (readable on a phone; tables may scroll horizontally — [Design Document §4](design-doc.md))

---

## 3. Explicitly Out of v1

Deferred on purpose. Listing them here keeps scope honest.

| Deferred item | Lands in |
|---|---|
| Hourly & contract/project payroll, timesheets | Phase 2 |
| Leave management & approval workflow | Phase 2 |
| Attendance tracking | Phase 2 |
| Employee self-service portal (own payslip, leave, profile) | Phase 2 |
| Payslip email delivery (v1 is download/print only) | Phase 2 |
| Onboarding checklist tracker, offboarding workflow | Phase 2 |
| Client CRM, invoicing, expense tracking | Phase 3 |
| Reporting & analytics dashboard | Phase 3 |
| Asset management, document repository, announcements | Phase 4 |
| Manager & Employee roles (PM view, self-service) | Phase 2–4 |
| Multi-tenancy / selling as a product | Not planned |
| Dark mode | Not planned (see [Design Document §5](design-doc.md)) |

**v1 home page is the employee directory** — no dashboard, no stat cards
([Design Document §5](design-doc.md)).

---

## 4. Roles in v1

Only two roles exist until Phase 2. Full role model in [data-model.md](data-model.md).

| Capability | Admin | HR |
|---|---|---|
| View/edit employees | ✅ | ✅ |
| View/edit salary & run payroll | ✅ | ✅ |
| Terminate / offboard | ✅ | ✅ |
| Manage projects & assignments | ✅ | View only |
| Manage users & app settings | ✅ | ❌ |
| View audit log | ✅ | ❌ |

Manager and Employee roles are designed for in the data model but **not exposed** in
v1 — no login is provisioned for them yet.

---

## 5. Phasing (aligned to spec §7)

- **Phase 1 (MVP) — this document.** Employees, fixed-salary payroll, projects, admin/HR auth.
- **Phase 2.** Hourly/contract pay + timesheets, leave & attendance, employee self-service, payslip email, onboarding/offboarding checklists.
- **Phase 3.** Client CRM, invoicing, expense tracking, reporting dashboard.
- **Phase 4.** Analytics, asset management, document repository, refined permissions, fuller audit.

---

## 6. Success Criteria for v1

v1 is "done" when an admin can, unaided:

1. Add an employee with documents and see them in the directory in under a minute.
2. Run a month's payroll for all active fixed-salary staff, adjust a line item, and mark each row paid.
3. Print a correct payslip (tax applied per slabs, currency shown).
4. Create a project, assign three employees with roles + allocation, and paste its Trello link.
5. Every salary change and termination appears in the audit log with who/when.

And every screen passes the [Design Document §4](design-doc.md) critique checklist.

---

## 7. Open Items Now Resolved

The spec's §8 questions are answered as of this plan:

- **Team size / growth:** design for a handful → 50+ without redesign (single-tenant).
- **Product vs internal:** internal only; no multi-tenancy.
- **Multi-currency:** yes — PKR default, currency stored per money value.
- **Tech stack:** Next.js full-stack + PostgreSQL (see [architecture.md](architecture.md)).
- **Tax:** Pakistan slabs, configurable.
- **Self-service:** not in v1; Phase 2.
