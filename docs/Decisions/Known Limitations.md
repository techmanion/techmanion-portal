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
| `BankDetail` | `models/employees.py`, table `bank_details` | No API endpoint reads or writes it. No UI shows it. See [[Database/Employees\|Database Employees]]. |
| `CompanyProfile` | `models/organization.py`, table `company_profiles` | Seeded once on startup (`seed_defaults()` in [[Backend/Architecture\|Backend Architecture]]) but never read by any endpoint or page. |
| `Employee.compensation_type` values `HOURLY`, `PROJECT` | `models/employees.py: CompensationType` | Accepted by the schema and storable, but no payroll logic branches on it — every payroll calculation assumes a fixed monthly base. See [[Database/Payroll\|Database Payroll]]. |
| `Employee.department_id` / `Employee.department` relationship | `models/employees.py` | Still a real column and relationship, but `EmployeeOut` no longer exposes a `department` field and there is no `departmentId` filter on `GET /employees` — see [[Backend/API\|Backend API]]. Departments are still managed via [[Features/Settings\|Settings]] for historical/future use. |
| `Employee.cnic`, `date_of_birth`, `address`, `emergency_contact_name/phone`, `probation_end_date`, `confirmation_date`, `access_log` | `models/employees.py` | Real columns, but none are collected or displayed anywhere in the current UI/schemas. `cnic` is always auto-generated (`PENDING-<hex>`) since no create/update schema exposes it. |
| `Department.is_active` / `Designation.is_active` | `models/organization.py` | Column defaults to `True`; no endpoint ever sets it `False`, and there's no delete endpoint either — lists only ever grow. See [[Database/Employees\|Database Employees]]. |

## UI controls that don't do anything yet

| Control | Where | Issue |
|---|---|---|
| `StatusChip` color logic for `CANCELLED`/`IN_PROGRESS` | `components/atoms/Badge.tsx` | Dead branches left over from the pre-simplification `ProjectStatus`/`PaymentStatus` enums (see [[Phase 1]]) — harmless, but no current enum value ever triggers them. |
| `lucide-react` dependency | `package.json` | Installed but not imported anywhere; the app's actual icon system is the Material Symbols web font (`Icon` atom). |
| No server-side pagination | every list page | Every list endpoint returns its **entire** result set; there is no `page`/`pageSize` query param anywhere in the API and no pagination control in the UI. Fine at current data volumes, would need addressing at scale. |

## Authorization model is coarser than the role list suggests

`UserRole` has four values, but the API only distinguishes Admin vs. not-Admin — `HR`,
`MANAGER`, and `EMPLOYEE` accounts are functionally identical today. See
[[Backend/Authentication|Backend Authentication]] for the exact enforcement and
[[Features/Settings|Features/Settings]] for where roles are assigned.

## Activity feed is lightweight, not a full audit trail

`ActivityLog` (replacing an earlier `AuditLog` design — see [[Phase 1]]) records
`entity`/`entity_id`/`action`/`description`/`timestamp` only. There is no `actor` column (who
made the change is not recorded), no `before`/`after` field-level snapshot, and no dedicated
read endpoint — it's only ever surfaced through `GET /home`'s `recentActivity` field, capped to
the 12 most recent rows across five entity types. See [[Backend/Services|Backend Services]].

## Infrastructure

- **File storage:** employee documents are written to local disk
  (`settings.upload_dir`, default `uploads/`) rather than any object storage service. This
  works for local development and single-instance deployment, but files would be lost on a
  redeploy/restart of an ephemeral filesystem. See [[Backend/API|Backend API]].
- **No background jobs:** `POST /payroll/generate` iterates every active employee
  synchronously inside one HTTP request — fine at current scale, but would need to move to a
  background task at a larger employee count.
- **No tests for the API surface beyond a smoke check:** `backend/tests/test_api.py` only
  checks `/health` and that an anonymous request to `/employees` is rejected;
  `backend/tests/test_services.py` covers only `employee_current_salary()`. There is no
  automated test coverage for the actual CRUD/business logic (payroll generation, project
  assignment, hiring conversion, etc.) — these were manually exercised against a live database
  during the backend/frontend structural refactor, but that verification isn't captured as a
  repeatable test. See [[Build & Run]].

## Related

[[Phase 1]] · [[Future Roadmap]] · [[Backend/Authentication|Backend Authentication]] ·
[[Database/Employees|Database Employees]] · [[AI Coding Conventions]]
