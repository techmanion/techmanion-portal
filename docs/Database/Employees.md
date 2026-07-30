---
tags: [database]
---

# Database: Employees

Source: `backend/app/models/employees.py` (Employee, SalaryRevision, BankDetail,
EmployeeDocument) and `backend/app/models/organization.py` (Department, Designation). Covers
the employee record itself, its salary history, documents, and the configurable
department/designation lists. For hiring-side data (jobs, candidates) see
[[Database/Hiring|Hiring]].

## `Employee`

The core HR record. Table `employees`.

| Column | Type | Notes |
|---|---|---|
| `first_name`, `last_name` | `String` | `full_name` is a computed Python `@property`, not a column |
| `cnic` | `String(32)`, unique | National ID; auto-filled `PENDING-<hex>` if omitted on create |
| `date_of_birth` | `Date`, nullable | |
| `email` | `String(320)`, unique | |
| `phone` | `String(40)` | |
| `address`, `emergency_contact_name`, `emergency_contact_phone` | nullable | |
| `employee_type` | `EmployeeType` enum | `FULL_TIME \| PART_TIME \| CONTRACT` |
| `status` | `EmployeeStatus` enum | `ACTIVE \| ON_LEAVE \| RESIGNED \| TERMINATED`, default `ACTIVE` |
| `compensation_type` | `CompensationType` enum | `FIXED \| HOURLY \| PROJECT`, default `FIXED` — only `FIXED` has any behavior; see [[Known Limitations]] |
| `department_id`, `designation_id` | FK, nullable | → `departments.id`, `designations.id` |
| `joining_date` | `Date` | required |
| `probation_end_date`, `confirmation_date` | `Date`, nullable | |
| `access_log` | `Text`, nullable | free-text note, e.g. "company email issued" — not an integration |

**No delete endpoint exists.** An employee's `status` is changed to `RESIGNED`/`TERMINATED`
instead of being removed — see [[Database/Relationships|Relationships]].

## `SalaryRevision`

Effective-dated pay history. Table `salary_revisions`, FK `employee_id` (cascade delete).

| Column | Notes |
|---|---|
| `base_amount` | `BigInteger`, minor units |
| `currency` | `String(3)`, default `PKR` |
| `effective_date` | `Date` |
| `reason` | free string, default `"HIRE"` (also set to `"RATE_CHANGE"` by the salary-revision form) |
| `created_by_user_id` | FK → `users.id` |

**Current salary resolution:** `app/services/employees.py: employee_current_salary(employee,
on_date)` returns the revision with the latest `effective_date <= on_date` (defaults to today). There is
no dedicated "current salary" column — it is always derived. Used by employee serialization
and by [[Database/Payroll|Payroll]] generation.

A new employee always gets one `SalaryRevision` created atomically with the `Employee` row
(`reason="HIRE"`), both in `POST /employees` and in the hiring conversion flow — see
[[Database/Hiring|Hiring]].

## `BankDetail` — modeled, not exposed

Table `bank_details`, 1:1 with `Employee` (`uselist=False`, cascade delete). Fields:
`account_title`, `account_number`, `iban`, `bank_name`, `payment_method` (default
`BANK_TRANSFER`).

> [!warning] No API
> No route in `api/routes/` reads or writes `BankDetail`. The model and relationship exist
> and the table is created by migrations, but nothing in the product creates, edits, or
> displays a bank detail today. See [[Known Limitations]].

## `EmployeeDocument`

Table `employee_documents`, FK `employee_id` (cascade delete).

| Column | Notes |
|---|---|
| `kind` | free string; frontend offers `CV, CONTRACT, ID_COPY, CERTIFICATE, OTHER` |
| `file_key` | unique storage key, `"{employee_id}/{uuid}{ext}"` |
| `file_name`, `mime_type`, `size_bytes` | |
| `uploaded_by_user_id` | FK → `users.id` |

Files are written to local disk under `settings.upload_dir` (default `uploads/`), **not**
object storage — see `POST /employees/{id}/documents` in [[Backend/API|API]] and
[[Known Limitations]]. 10 MB upload limit enforced server-side.

## `Department` / `Designation`

Simple configurable lookup lists, tables `departments` / `designations`. Both have `name`
(unique) and `is_active` (`Boolean`, default `True`).

> [!warning] `is_active` is write-only from the schema's perspective
> The column exists and defaults to `True`, but no endpoint ever sets it to `False`, and there
> is no delete endpoint either. In practice every department/designation ever created stays
> active and visible forever. See [[Known Limitations]].

## Related

[[Database/Schema|Database Schema]] · [[Database/Hiring|Database Hiring]] ·
[[Database/Payroll|Database Payroll]] · [[Database/Relationships|Relationships]] ·
[[Features/Employees|Employees feature]]
