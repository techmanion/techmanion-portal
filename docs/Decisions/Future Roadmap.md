---
tags: [decisions]
---

# Future Roadmap

> [!info] Everything on this page is **Planned**
> Nothing below exists in the current codebase. This page exists so a reader doesn't confuse
> "documented aspiration" with "shipped feature." It carries forward the phase plan from the
> legacy [[planning-doc]] (§5), adjusted to note where the actual Phase 1 already differs (see
> [[Phase 1]]).

## Phase 2 (originally planned, not started)

| Item | Notes |
|---|---|
| Hourly & contract/project payroll, timesheets | `CompensationType.HOURLY`/`.PROJECT` enum values already exist and are accepted by the API, but nothing computes hourly/project pay — see [[Known Limitations]] |
| Leave management & approval workflow | No leave-related model exists |
| Attendance tracking | No attendance model exists; the "Attendance 98%" figure on the employee Overview tab is hardcoded demo UI, not real data — see [[Features/Employees\|Features/Employees]] |
| Employee self-service portal (own payslip, leave, profile) | Requires linking `User` ↔ `Employee`, which doesn't exist today — see [[Database/Relationships\|Database Relationships]] |
| Payslip email delivery | No payslip document exists at all post-simplification (see [[Phase 1]]), let alone email delivery |
| Onboarding/offboarding checklist tracker | Not modeled |
| Manager/Employee self-service roles | The `UserRole` enum already has these values, but they carry no distinct permissions today — see [[Backend/Authentication\|Backend Authentication]] |

## Phase 3 (originally planned, not started)

| Item | Notes |
|---|---|
| Client CRM | `Project.clientName` remains free text; there is no `Client` entity |
| Invoicing | Not modeled |
| Expense tracking | Not modeled |
| Reporting & analytics dashboard | The Home page's "Needs Attention"/"Upcoming"/"Recent Activity" panels are empty-state placeholders that could become this — see [[Features/Home\|Features/Home]] |
| Multi-currency FX conversion | Money is stored per-value with its own currency code today, but there is no conversion/rate logic |

## Phase 4 (originally planned, not started)

| Item | Notes |
|---|---|
| Asset management | Not modeled |
| Document repository (company-wide, not per-employee) | `EmployeeDocument` exists per-employee only |
| Announcements | Not modeled |

## Things noted here that are *not* on any known roadmap but are gaps today

See [[Known Limitations]] for issues that aren't "the next phase" so much as loose ends in the
current build (dead UI controls, unused models, decorative pagination, etc.) — those are
distinguished from genuine future-phase features on this page.

## Related

[[Phase 1]] · [[Known Limitations]] · [[Project Overview]]
