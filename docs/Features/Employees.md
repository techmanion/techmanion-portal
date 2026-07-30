---
tags: [feature]
---

# Feature: Employees

Routes `/employees`, `/employees/new`, `/employees/:id`, `/employees/:id/edit`. Components
`employees.tsx`, `employee-form.tsx`, `employee-detail.tsx`. Backed by
[[Database/Employees|Database: Employees]] and the `/employees/*` endpoints in
[[Backend/API|Backend API]].

## Directory (`/employees`)

- Search box (name/email/CNIC), plus filters for job title (designation), employment type,
  and status. Search/filter re-queries the server (debounced 180ms).
- Table columns: employee, job title, employment type, joining date, status
  (`EmployeeTable` organism).
- "Add employee" button → `/employees/new`.

## Create / edit (`/employees/new`, `/employees/:id/edit`)

One shared form component, `employee-form.tsx`:

- **Create mode** collects contact + employment details **and** an initial monthly
  compensation + currency (this becomes the employee's first `SalaryRevision`,
  `reason="HIRE"`).
- **Edit mode** hides the compensation section entirely — base salary can't be changed here
  once the employee exists. Salary changes after creation go through the detail page's
  Compensation tab (see below).
- CNIC can be left blank; the backend auto-generates a `PENDING-<hex>` placeholder value.

## Detail page (`/employees/:id`)

Header (`ProfileHeader`): portrait, name, status chip, designation/department/type, EMP-ID,
email, joining date, plus an "Edit Employee" link.

Six tabs are rendered; **only three have real content**:

| Tab | Status | Content |
|---|---|---|
| Overview | ✅ Implemented | Read-only summary: name, email, phone, job title, employment type, status, joining date. The right-hand "Project Allocation" panel and the Attendance/Performance stat tiles are **hardcoded example data**, not derived from real projects/attendance data — there is no attendance feature in the backend. |
| Compensation | ✅ Implemented | Shows current salary (derived, see [[Database/Employees\|Database Employees]]) and a form to add a new dated `SalaryRevision` (`POST /employees/{id}/salary`). This is the only place salary changes after initial hire. |
| Documents | ✅ Implemented | List of uploaded documents with download; upload form (`kind` + file, 10 MB limit). Files land on the backend's local disk — see [[Backend/API\|Backend API]]. |
| Employment | ⚠️ Planned | Renders a generic placeholder ("Employment details will appear here.") |
| Projects | ⚠️ Planned | Same generic placeholder — **not** connected to `ProjectAssignment` even though that data exists; see [[Database/Projects\|Database Projects]] |
| Activity | ⚠️ Planned | Same generic placeholder — not connected to `AuditLog` even though entity-scoped audit entries exist for this employee |

> [!warning] Overview tab shows fabricated demo numbers
> The "Project Allocation" percentages, "Attendance 98%", and "Performance 4.9" tiles on the
> Overview tab are static JSX, not computed from any real data — see [[Known Limitations]].

## Related pages

- Salary history is not shown as a list anywhere in the UI today — only the *current* salary
  and a form to add a new revision. The full `salary_revisions` history exists in the
  database and API response (`EmployeeOut` doesn't include it either — see
  [[Backend/API|Backend API]]) but nothing renders it.

## Related

[[Database/Employees|Database Employees]] · [[Backend/API|Backend API]] ·
[[Frontend/Pages|Frontend Pages]] · [[Known Limitations]]
