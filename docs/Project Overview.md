---
tags: [overview]
---

# Project Overview

Techmanion Portal is a **single-tenant, internal admin tool** for a software house to manage
people, hiring, projects, and payroll from one place. It is not a public product and has no
multi-tenant support — see [[Known Limitations]].

Only **Admin** and **HR**-type portal accounts sign in and use the system today; there is no
employee self-service login (see [[Features/Home|Home feature]] and [[Backend/Authentication|Authentication]]).

## What it does today

| Module | Summary | Docs |
|---|---|---|
| **Hiring** | Track open jobs and candidates through a stage pipeline, convert a hired candidate straight into an employee record. | [[Features/Hiring\|Hiring]] |
| **Employees** | Directory of employee records with contact/employment details, salary revision history, and document uploads. | [[Features/Employees\|Employees]] |
| **Projects** | Client project registry with status tracking and a simple employee-to-project team roster. | [[Features/Projects\|Projects]] |
| **Payroll** | Monthly payroll entries per employee (base compensation + adjustment), generated from current salary, marked paid. | [[Features/Payroll\|Payroll]] |
| **Settings / Team** | Manage the configurable department/designation lists, portal login accounts (admin-only), and view the audit log. | [[Features/Settings\|Settings]] |
| **Home** | Landing dashboard shell. Mostly static placeholders today — see [[Known Limitations]]. | [[Features/Home\|Home]] |

## Who uses it

The `User` model (portal login account) has four role values — `ADMIN`, `HR`, `MANAGER`,
`EMPLOYEE` — but the API only actually enforces a **two-tier** boundary: Admin vs.
everyone-else. See [[Backend/Authentication|Authentication]] for the exact rule and why
MANAGER/EMPLOYEE accounts behave identically to HR today.

`User` accounts (who can log in) and `Employee` records (who is on the payroll) are
**separate, unlinked models** — creating an employee does not create a login, and there is no
field connecting the two. See [[Database/Relationships|Relationships]].

## How it's built

- **Backend:** FastAPI (Python) REST API over PostgreSQL via SQLAlchemy 2 + Alembic. See
  [[Backend/Architecture|Backend Architecture]].
- **Frontend:** React 19 + Vite single-page app, talking to the API over `fetch`. See
  [[Frontend/UI Architecture|UI Architecture]].
- Full stack detail: [[Tech Stack]]. Full system diagram: [[System Architecture]].

## History

The repository originally started life as a Next.js + Prisma scaffold (see early commit log)
and a companion set of planning documents at the `docs/` root
([[software-house-management-system-spec]], [[design-doc]], [[planning-doc]], [[architecture]],
[[data-model]], [[decisions]]) describing a fuller "v1" scope (tax engine, Trello links,
contract values, allocation percentages, partial payments). The codebase was rebuilt on
FastAPI + React, and Projects/Payroll were later **simplified relative to that original
plan**. [[Phase 1]] documents exactly what shipped and what was intentionally cut.
