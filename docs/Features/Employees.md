---
tags: [feature]
---

# Feature: Employees

Routes `/employees`, `/employees/new`, `/employees/:id`, `/employees/:id/edit`. Components
`employees.tsx`, `employee-form.tsx`, `employee-detail.tsx` (with `EmployeeOverviewPanel`,
`CompensationPanel`, `DocumentsPanel` organisms — see [[Frontend/Components|Frontend
Components]]). Backed by [[Database/Employees|Database: Employees]] and the `/employees/*`
endpoints in [[Backend/API|Backend API]].

## Directory (`/employees`)

- Search box (name/email), plus filters for job title (designation), employment type, and
  status. Search/filter re-queries the server (debounced 180ms via `useDebouncedValue`). There
  is no department filter and no CNIC search — see [[Backend/API|Backend API]].
- Table columns: employee, job title, employment type, joining date, status
  (`EmployeeTable` organism).
- "Add employee" button → `/employees/new`.

## Create / edit (`/employees/new`, `/employees/:id/edit`)

One shared form component, `employee-form.tsx`:

- **Create mode** collects contact + employment details **and** an initial monthly
  compensation + currency (via the `MoneyInput` molecule; this becomes the employee's first
  `SalaryRevision`, `reason="HIRE"`).
- **Edit mode** hides the compensation section entirely — base salary can't be changed here
  once the employee exists. Salary changes after creation go through the detail page's
  Compensation tab (see below).
- CNIC is not collected by this form at all; the backend always auto-generates a
  `PENDING-<hex>` placeholder value for it — see [[Known Limitations]].

## Detail page (`/employees/:id`)

Header (`ProfileHeader`): portrait, name, status chip, designation/type, email, joining date,
plus an "Edit Employee" link.

Three tabs, **all fully implemented** (there are no placeholder tabs):

| Tab | Content |
|---|---|
| Overview | Read-only summary: name, email, phone, job title, employment type, status, joining date. Every field is real data — there is no fabricated demo/stat content on this tab. |
| Compensation | Shows current salary (derived, see [[Database/Employees\|Database Employees]]) and a form to add a new dated `SalaryRevision` (`POST /employees/{id}/salary`). This is the only place salary changes after initial hire. |
| Documents | List of uploaded documents with download; upload form (`kind` + file, 10 MB limit). Files land on the backend's local disk — see [[Backend/API\|Backend API]]. |

## Related pages

- Salary history is not shown as a list anywhere in the UI today — only the *current* salary
  and a form to add a new revision. The full `salary_revisions` history exists in the
  database and API (`EmployeeOut` doesn't include it either — see [[Backend/API|Backend API]])
  but nothing renders it.

## Related

[[Database/Employees|Database Employees]] · [[Backend/API|Backend API]] ·
[[Frontend/Pages|Frontend Pages]] · [[Frontend/Components|Frontend Components]] ·
[[Known Limitations]]
