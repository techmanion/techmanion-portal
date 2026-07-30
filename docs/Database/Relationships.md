---
tags: [database]
---

# Database: Relationships

Cross-cutting foreign-key, cascade, and integrity behavior across every table in
[[Database/Schema|Schema]].

## Foreign keys and cascade behavior

| From | To | `ondelete` | Effect |
|---|---|---|---|
| `Candidate.job_id` | `Job.id` | `CASCADE` | Deleting a job deletes its candidates (also enforced by the ORM `cascade="all, delete-orphan"` on `Job.candidates`) |
| `SalaryRevision.employee_id` | `Employee.id` | `CASCADE` | Deleting an employee would delete salary history — moot, see below |
| `BankDetail.employee_id` | `Employee.id` | `CASCADE` | unique per employee (1:1) |
| `EmployeeDocument.employee_id` | `Employee.id` | `CASCADE` | |
| `ProjectAssignment.project_id` | `Project.id` | `CASCADE` | Deleting a project deletes its assignments |
| `ProjectAssignment.employee_id` | `Employee.id` | *(no explicit ondelete)* | |
| `PayrollEntry.employee_id` | `Employee.id` | *(no explicit ondelete)* | |
| `Employee.department_id` / `designation_id` | `Department`/`Designation.id` | *(no explicit ondelete)* | nullable — employee survives if the FK target is later "removed" (moot, see below) |
| `SalaryRevision.created_by_user_id`, `EmployeeDocument.uploaded_by_user_id` | `User.id` | *(no explicit ondelete)* | |

## No hard deletes for the core entities

There is **no `DELETE` endpoint** for `Employee`, `User`, `Department`, or `Designation`
anywhere in `backend/app/api/routes/`. In practice:

- An employee is deactivated by changing `status` to `RESIGNED`/`TERMINATED`, never deleted.
- A portal user is deactivated via `PATCH /users/{id} { isActive: false }`, never deleted.
- Departments/designations can only be **added**, never removed or deactivated (see
  [[Database/Employees|Employees]]).

Entities that **do** have delete endpoints: `Job` (cascades to `Candidate`), `Candidate`,
`Project` (cascades to `ProjectAssignment`), `PayrollEntry`.

## Unique constraints

| Table | Constraint |
|---|---|
| `users.email` | unique |
| `employees.cnic`, `employees.email` | unique |
| `departments.name`, `designations.name` | unique |
| `projects.name` | unique |
| `bank_details.employee_id` | unique (1:1) |
| `employee_documents.file_key` | unique |
| `project_assignments (project_id, employee_id)` | composite unique — one assignment row per employee per project |
| `payroll_entries (employee_id, month)` | composite unique — one payroll entry per employee per month |

## Entities with no relationship to each other

- **`User` ⇎ `Employee`** — a portal login account is never linked to an employee record.
  There is no `employee_id` column on `User`. Creating an employee doesn't create a login, and
  vice versa. This is why there is no employee self-service login today — see
  [[Backend/Authentication|Authentication]] and [[Known Limitations]].
- **`Candidate` ⇎ `Employee`** (after conversion) — `POST /candidates/{id}/convert` creates a
  new, independent `Employee` row; nothing links back to the source `Candidate` (see
  [[Database/Hiring|Hiring]]).
- **`Project` ⇎ `PayrollEntry`** — payroll has no concept of project cost allocation; a
  `PayrollEntry` only ever references an `Employee`.

## Activity log relationship

`ActivityLog` rows are **polymorphic** — `entity` (string, e.g. `"Employee"`, `"Project"`,
`"PayrollEntry"`) + `entity_id` (string) reference a row in another table without an actual FK
constraint, and there is no `actor` column at all (unlike the earlier `AuditLog` design — see
[[Phase 1]]). This lets one log table cover every entity type for the Home page's "Recent
Activity" feed. See [[Backend/Services|Services]] for the `log_activity()` helper and the full
list of actions it's called for.

## Related

[[Database/Schema|Database Schema]] · [[Database/Employees|Database Employees]] ·
[[Database/Projects|Database Projects]] · [[Database/Payroll|Database Payroll]] ·
[[Backend/Models|Backend Models]]
