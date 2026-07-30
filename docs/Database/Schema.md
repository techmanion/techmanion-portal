---
tags: [database]
---

# Database Schema

All tables are defined as SQLAlchemy models in `backend/app/models.py` and created/altered by
Alembic migrations in `backend/alembic/versions/`. Database: **PostgreSQL**.

Every table (except `audit_logs`) mixes in `TimestampMixin` → `created_at`, `updated_at`
(timezone-aware, server-set in Python via `utc_now()`).

## Entity-relationship diagram

```mermaid
erDiagram
    USER ||--o{ SALARY_REVISION : "created_by_user_id"
    USER ||--o{ EMPLOYEE_DOCUMENT : "uploaded_by_user_id"
    USER ||--o{ AUDIT_LOG : "actor_user_id"

    DEPARTMENT ||--o{ EMPLOYEE : "department_id"
    DESIGNATION ||--o{ EMPLOYEE : "designation_id"

    JOB ||--o{ CANDIDATE : "job_id"

    EMPLOYEE ||--o{ SALARY_REVISION : "employee_id"
    EMPLOYEE ||--o| BANK_DETAIL : "employee_id (1:1, unused)"
    EMPLOYEE ||--o{ EMPLOYEE_DOCUMENT : "employee_id"
    EMPLOYEE ||--o{ PROJECT_ASSIGNMENT : "employee_id"
    EMPLOYEE ||--o{ PAYROLL_ENTRY : "employee_id"

    PROJECT ||--o{ PROJECT_ASSIGNMENT : "project_id"

    USER {
        int id PK
        string email UK
        string password_hash
        string name
        enum role "ADMIN|HR|MANAGER|EMPLOYEE"
        bool is_active
    }
    EMPLOYEE {
        int id PK
        string first_name
        string last_name
        string cnic UK
        string email UK
        enum employee_type
        enum status
        enum compensation_type
        int department_id FK
        int designation_id FK
        date joining_date
    }
    SALARY_REVISION {
        int id PK
        int employee_id FK
        bigint base_amount "minor units"
        string currency
        date effective_date
        string reason
    }
    BANK_DETAIL {
        int id PK
        int employee_id FK "unique"
        string account_title
        string iban
    }
    EMPLOYEE_DOCUMENT {
        int id PK
        int employee_id FK
        string kind
        string file_key UK
    }
    JOB {
        int id PK
        string title
        enum status "OPEN|CLOSED"
    }
    CANDIDATE {
        int id PK
        int job_id FK
        enum stage
    }
    PROJECT {
        int id PK
        string name UK
        string client_name
        enum status "PLANNED|ACTIVE|ON_HOLD|COMPLETED"
        date start_date
        date end_date
    }
    PROJECT_ASSIGNMENT {
        int id PK
        int project_id FK
        int employee_id FK
    }
    PAYROLL_ENTRY {
        int id PK
        int employee_id FK
        string month "YYYY-MM"
        bigint base_compensation
        bigint adjustment
        bigint final_amount
        enum status "PENDING|PAID"
    }
    DEPARTMENT {
        int id PK
        string name UK
        bool is_active
    }
    DESIGNATION {
        int id PK
        string name UK
        bool is_active
    }
    COMPANY_PROFILE {
        int id PK
        string name
        string default_currency
    }
    AUDIT_LOG {
        int id PK
        int actor_user_id FK
        string action
        string entity_type
        string entity_id
        json before
        json after
    }
```

`PROJECT_ASSIGNMENT` and `PAYROLL_ENTRY` each have a composite `UniqueConstraint` — see
[[Database/Relationships|Relationships]].

## Tables at a glance

| Table | Model | Purpose | Doc |
|---|---|---|---|
| `users` | `User` | Portal login accounts | [[Backend/Authentication\|Authentication]] |
| `departments` | `Department` | Configurable department list | [[Database/Employees\|Employees]] |
| `designations` | `Designation` | Configurable job-title list | [[Database/Employees\|Employees]] |
| `jobs` | `Job` | Open roles | [[Database/Hiring\|Hiring]] |
| `candidates` | `Candidate` | Applicants against a job | [[Database/Hiring\|Hiring]] |
| `employees` | `Employee` | Employee record | [[Database/Employees\|Employees]] |
| `salary_revisions` | `SalaryRevision` | Effective-dated salary history | [[Database/Employees\|Employees]] |
| `bank_details` | `BankDetail` | Bank account per employee — **modeled, no API** | [[Known Limitations]] |
| `employee_documents` | `EmployeeDocument` | Uploaded file metadata | [[Database/Employees\|Employees]] |
| `projects` | `Project` | Client project | [[Database/Projects\|Projects]] |
| `project_assignments` | `ProjectAssignment` | Employee ⇄ project join | [[Database/Projects\|Projects]] |
| `payroll_entries` | `PayrollEntry` | One payroll line per employee per month | [[Database/Payroll\|Payroll]] |
| `company_profiles` | `CompanyProfile` | Single-row company info — **modeled, no API** | [[Known Limitations]] |
| `audit_logs` | `AuditLog` | Append-only action log | [[Backend/Services\|Services]] |

## Enums

Defined as `str, Enum` classes in `models.py`, stored as native Postgres `ENUM` types via
SQLAlchemy's `Enum(...)`.

| Enum | Values | Used by |
|---|---|---|
| `UserRole` | `ADMIN, HR, MANAGER, EMPLOYEE` | `User.role` |
| `EmployeeType` | `FULL_TIME, PART_TIME, CONTRACT` | `Employee.employee_type` |
| `EmployeeStatus` | `ACTIVE, ON_LEAVE, RESIGNED, TERMINATED` | `Employee.status` |
| `CompensationType` | `FIXED, HOURLY, PROJECT` | `Employee.compensation_type` (only `FIXED` is functionally used — see [[Known Limitations]]) |
| `ProjectStatus` | `PLANNED, ACTIVE, ON_HOLD, COMPLETED` | `Project.status` |
| `PayrollEntryStatus` | `PENDING, PAID` | `PayrollEntry.status` |
| `JobStatus` | `OPEN, CLOSED` | `Job.status` |
| `CandidateStage` | `APPLIED, SCREENING, INTERVIEW, OFFER, HIRED, REJECTED` | `Candidate.stage` |

## Money convention

Every monetary column (`base_amount`, `base_compensation`, `adjustment`, `final_amount`) is a
`BigInteger` storing **minor currency units** (e.g. paisa, not rupees), paired with a
3-letter `currency` string column (default `"PKR"`). The frontend divides/multiplies by 100 at
the UI boundary — see `frontend/src/lib/format.ts: formatMoney()` and
[[Frontend/State Management|State Management]]. There is no floating-point money anywhere in
the schema.

## Migration history

| Migration | Effect |
|---|---|
| `20260725_01_initial` | Base schema via `Base.metadata.create_all` |
| `20260730_02_hiring` | Adds `jobs`, `candidates` |
| `20260730_03_simplify_projects_payroll` | Drops legacy `payroll_runs`/`payslips`/`payslip_line_items`/`tax_slabs` tables and their enum types, trims `projects`/`project_assignments` columns, creates `payroll_entries` | 

See [[Phase 1]] for why the third migration exists (a deliberate simplification of the
original payroll/project design).

## Related

[[Database/Relationships|Relationships]] · [[Database/Employees|Employees]] ·
[[Database/Hiring|Hiring]] · [[Database/Projects|Projects]] · [[Database/Payroll|Payroll]] ·
[[Backend/Models|Backend Models]]
