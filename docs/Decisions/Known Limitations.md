---
tags: [decisions]
---

# Known Limitations

Concrete gaps and rough edges found directly in the current code — as opposed to
[[Future Roadmap]] items, which are whole unbuilt features. Everything here is something that
*partially* exists (a model, a control, a config value) but doesn't fully work end to end.

## Data modeled but never exposed

| Thing | Where it lives | What's missing |
|---|---|---|
| `BankDetail` | `models.py`, table `bank_details` | No API endpoint reads or writes it. No UI shows it. See [[Database/Employees\|Database Employees]]. |
| `CompanyProfile` | `models.py`, table `company_profiles` | Seeded once on startup (`seed_defaults()` in [[Backend/Architecture\|Backend Architecture]]) but never read by any endpoint or page. |
| `Employee.compensation_type` values `HOURLY`, `PROJECT` | `models.py: CompensationType` | Accepted by the schema and storable, but no payroll logic branches on it — every payroll calculation assumes a fixed monthly base. See [[Database/Payroll\|Database Payroll]]. |
| `Department.is_active` / `Designation.is_active` | `models.py` | Column defaults to `True`; no endpoint ever sets it `False`, and there's no delete endpoint either — lists only ever grow. See [[Database/Employees\|Database Employees]]. |

## UI controls that don't do anything yet

| Control | Where | Issue |
|---|---|---|
| `QuickAction` buttons (Add candidate / Add employee / New project / Run payroll) | `pages/home.tsx` | No `onClick` handler at all. See [[Features/Home\|Features/Home]]. |
| "Needs Attention" / "Upcoming" / "Recent Activity" panels | `pages/home.tsx` | Always render a static `EmptyState`; no backing data source exists. |
| `PaginationControls` | `components/molecules/PaginationControls.tsx`, used in `employees.tsx`, `projects.tsx`, `payroll.tsx` | Rendered with hardcoded `page={1}` and a fixed `pageCount`; `onPageChange` is never passed, so clicking page numbers does nothing. Every list endpoint returns its **entire** result set — there is no server-side pagination at all. |
| `Checkbox` column in `EmployeeTable` | `components/organisms/EmployeeTable.tsx` | Purely decorative — no select-all/bulk-action logic wired to it. |
| Employee detail tabs: Employment, Projects, Activity | `pages/employee-detail.tsx` | Render a generic `"{tab} details will appear here."` placeholder. Notably, **Projects** and **Activity** placeholders exist even though the underlying data (`ProjectAssignment`, `AuditLog`) is fully queryable via other endpoints — see [[Features/Employees\|Features/Employees]]. |
| Overview tab's "Project Allocation", "Attendance 98%", "Performance 4.9" | `pages/employee-detail.tsx` | Hardcoded demo values in JSX, not derived from any query. |
| `StatusChip` color logic for `CANCELLED`/`IN_PROGRESS` | `components/atoms/Badge.tsx` | Dead branches left over from the pre-simplification `ProjectStatus`/`PaymentStatus` enums (see [[Phase 1]]) — harmless, but no current enum value ever triggers them. |
| `lucide-react` dependency | `package.json` | Installed but not imported anywhere; the app's actual icon system is the Material Symbols web font (`Icon` atom). |

## Authorization model is coarser than the role list suggests

`UserRole` has four values, but the API only distinguishes Admin vs. not-Admin — `HR`,
`MANAGER`, and `EMPLOYEE` accounts are functionally identical today. See
[[Backend/Authentication|Backend Authentication]] for the exact enforcement and
[[Features/Settings|Features/Settings]] for where roles are assigned.

## Infrastructure

- **File storage:** employee documents are written to local disk
  (`settings.upload_dir`, default `uploads/`) rather than any object storage service. This
  works for local development and single-instance deployment, but files would be lost on a
  redeploy/restart of an ephemeral filesystem. See [[Backend/API|Backend API]].
- **No background jobs:** `POST /payroll/generate` iterates every active employee
  synchronously inside one HTTP request — fine at current scale, but would need to move to a
  background task at a larger employee count.
- **No tests for the API surface beyond a smoke check:** `backend/tests/test_api.py` only
  checks `/health` and that an anonymous request to `/employees` is rejected. There is no
  automated test coverage for the actual CRUD/business logic (payroll generation, project
  assignment, hiring conversion, etc.). See [[Build & Run]].

## Related

[[Phase 1]] · [[Future Roadmap]] · [[Backend/Authentication|Backend Authentication]] ·
[[Database/Employees|Database Employees]]
