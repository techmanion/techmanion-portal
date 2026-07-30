---
tags: [backend]
---

# Backend API Reference

All routes are mounted under **`/api/v1`** (`app/config.py: api_prefix`, set in `main.py`).
Source: `backend/app/api.py`. Interactive docs are also live at `/docs` (Swagger) and `/redoc`
— see [[Backend/Architecture|Backend Architecture]].

**Auth column key:**
- **Public** — no token required
- **CurrentUser** — any active, logged-in user (any role)
- **AdminUser** — must be logged in **and** `role == ADMIN`

All request/response bodies are JSON with **camelCase** keys (Pydantic `alias_generator`,
see [[Backend/Models|Backend Models]]) even though Python fields are snake_case.

## Auth (`/auth`)

| Method | Path | Auth | Body → Response | Notes |
|---|---|---|---|---|
| `POST` | `/auth/login` | Public | form-encoded `username`,`password` → `TokenOut` | `username` is matched case-insensitively against `email`; wrong credentials or inactive user → `401` |
| `GET` | `/auth/me` | CurrentUser | → `UserOut` | |
| `PATCH` | `/auth/me` | CurrentUser | `ProfileUpdate{name}` → `UserOut` | writes an audit entry `user.profile_updated` |
| `POST` | `/auth/change-password` | CurrentUser | `PasswordChange{currentPassword,newPassword}` → `204` | `400` if current password is wrong |

## Team / users (`/users`) — admin-only account management

| Method | Path | Auth | Body → Response | Notes |
|---|---|---|---|---|
| `GET` | `/users` | AdminUser | → `UserOut[]` | ordered by name |
| `POST` | `/users` | AdminUser | `UserCreate{name,email,password,role}` → `UserOut` (`201`) | `409` on duplicate email |
| `PATCH` | `/users/{id}` | AdminUser | `UserAdminUpdate{role?,isActive?}` → `UserOut` | `400` if an admin tries to demote/deactivate **themselves** |

See [[Features/Settings|Settings feature]] (Team Members page) and
[[Backend/Authentication|Authentication]].

## Employees (`/employees`)

| Method | Path | Auth | Body → Response | Notes |
|---|---|---|---|---|
| `GET` | `/employees` | CurrentUser | query: `search, statusFilter, departmentId, designationId` → `EmployeeOut[]` | `search` matches first/last name, email, cnic (`ILIKE`) |
| `POST` | `/employees` | CurrentUser | `EmployeeCreate` (adds `baseAmount`,`currency`) → `EmployeeOut` (`201`) | also creates the first `SalaryRevision` (`reason="HIRE"`) in the same transaction; `409` on duplicate email/cnic |
| `GET` | `/employees/{id}` | CurrentUser | → `EmployeeOut` | |
| `PUT` | `/employees/{id}` | CurrentUser | `EmployeeUpdate` → `EmployeeOut` | omits `cnic` from the update if blank; `409` on duplicate email/cnic |
| `POST` | `/employees/{id}/salary` | CurrentUser | `SalaryCreate{baseAmount,currency,effectiveDate,reason}` → `SalaryOut` | appends a new `SalaryRevision`; audit `salary.revised` |
| `GET` | `/employees/{id}/documents` | CurrentUser | → `DocumentOut[]` | newest first |
| `POST` | `/employees/{id}/documents` | CurrentUser | multipart `kind` + `file` → `DocumentOut` (`201`) | `413` if file > 10 MB; written to local disk |
| `GET` | `/documents/{id}/download` | CurrentUser | → file stream | `404` if the DB row or the on-disk file is missing |

No `DELETE /employees/{id}` exists — see [[Database/Relationships|Relationships]].
`EmployeeOut` embeds the resolved `department`, `designation`, and `currentSalary` (derived via
[[Backend/Services|Services]]`.employee_current_salary()`), not just their IDs.

## Hiring — jobs (`/jobs`)

| Method | Path | Auth | Body → Response |
|---|---|---|---|
| `GET` | `/jobs` | CurrentUser | → `JobOut[]` (newest first) |
| `POST` | `/jobs` | CurrentUser | `JobCreate{title,description,status}` → `JobOut` (`201`) |
| `GET` | `/jobs/{id}` | CurrentUser | → `JobOut` |
| `PUT` | `/jobs/{id}` | CurrentUser | `JobUpdate` → `JobOut` |
| `DELETE` | `/jobs/{id}` | CurrentUser | → `204` (cascades to its candidates) |

## Hiring — candidates (`/candidates`)

| Method | Path | Auth | Body → Response | Notes |
|---|---|---|---|---|
| `GET` | `/candidates` | CurrentUser | query: `search, stage, jobId` → `CandidateOut[]` | `search` matches name/email |
| `POST` | `/candidates` | CurrentUser | `CandidateCreate` → `CandidateOut` (`201`) | `404` if `jobId` doesn't exist |
| `GET` | `/candidates/{id}` | CurrentUser | → `CandidateOut` | |
| `PUT` | `/candidates/{id}` | CurrentUser | `CandidateUpdate` → `CandidateOut` | |
| `DELETE` | `/candidates/{id}` | CurrentUser | → `204` | |
| `POST` | `/candidates/{id}/convert` | CurrentUser | `ConvertToEmployeePayload` → `EmployeeOut` (`201`) | creates `Employee` + `SalaryRevision`, sets `stage=HIRED`; `409` on email collision — see [[Database/Hiring\|Database Hiring]] |

## Projects (`/projects`)

| Method | Path | Auth | Body → Response | Notes |
|---|---|---|---|---|
| `GET` | `/projects` | CurrentUser | → `ProjectOut[]` (ordered by name, includes `assignments[]`) | |
| `POST` | `/projects` | **AdminUser** | `ProjectCreate` → `ProjectOut` (`201`) | `409` on duplicate name |
| `GET` | `/projects/{id}` | CurrentUser | → `ProjectOut` | |
| `PUT` | `/projects/{id}` | **AdminUser** | `ProjectUpdate` → `ProjectOut` | `409` on duplicate name |
| `DELETE` | `/projects/{id}` | **AdminUser** | → `204` (cascades to assignments) | |
| `POST` | `/projects/{id}/assignments` | **AdminUser** | `ProjectAssignmentCreate{employeeId}` → `ProjectOut` | `404` if project/employee missing, `409` if already assigned |
| `DELETE` | `/projects/{id}/assignments/{assignmentId}` | **AdminUser** | → `ProjectOut` | removes one team member |

Non-admin `CurrentUser`s can list/view projects but cannot create, edit, delete, or manage
team members — this matches the original Admin/HR split from [[decisions]]. See
[[Features/Projects|Projects feature]].

## Payroll (`/payroll`)

| Method | Path | Auth | Body → Response | Notes |
|---|---|---|---|---|
| `GET` | `/payroll` | CurrentUser | query: `month?` → `PayrollEntryOut[]` | if `month` omitted, returns every entry ever created, newest month first |
| `POST` | `/payroll` | CurrentUser | `PayrollEntryCreate` → `PayrollEntryOut` (`201`) | `422` on bad `month` format, `404` unknown employee, `409` duplicate employee+month |
| `POST` | `/payroll/generate` | CurrentUser | query: `month` → `PayrollEntryOut[]` | creates missing entries for `ACTIVE` employees from current salary; see [[Database/Payroll\|Database Payroll]] |
| `PUT` | `/payroll/{id}` | CurrentUser | `PayrollEntryUpdate` → `PayrollEntryOut` | recomputes `finalAmount` |
| `DELETE` | `/payroll/{id}` | CurrentUser | → `204` | |
| `PATCH` | `/payroll/{id}/pay` | CurrentUser | `PayrollMarkPaid{paymentDate?}` → `PayrollEntryOut` | sets `status=PAID`, `paymentDate` defaults to today |

Any logged-in user (not just Admin) can run payroll — see [[Backend/Authentication|Authentication]].

## Settings (`/settings`)

| Method | Path | Auth | Body → Response | Notes |
|---|---|---|---|---|
| `GET` | `/settings/departments` | CurrentUser | → `NamedOption[]` | |
| `POST` | `/settings/departments` | **AdminUser** | query: `name` → `NamedOption` | |
| `GET` | `/settings/designations` | CurrentUser | → `NamedOption[]` | |
| `POST` | `/settings/designations` | **AdminUser** | query: `name` → `NamedOption` | |

No `PATCH`/`DELETE` for either — see [[Database/Employees|Database Employees]].

## Audit (`/audit`)

| Method | Path | Auth | Body → Response |
|---|---|---|---|
| `GET` | `/audit` | **AdminUser** | → `AuditOut[]` (latest 200, newest first) |

## Misc (outside `/api/v1`)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness check, `{"status": "ok"}` |
| `GET` | `/docs`, `/redoc` | OpenAPI documentation UIs |

## Related

[[Backend/Architecture|Backend Architecture]] · [[Backend/Models|Backend Models]] ·
[[Backend/Authentication|Backend Authentication]] · [[Backend/Services|Backend Services]] ·
[[Frontend/State Management|Frontend State Management]] (how the SPA calls these)
