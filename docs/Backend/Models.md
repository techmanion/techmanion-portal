---
tags: [backend]
---

# Backend Models

Source: `backend/app/models/` — one module per domain, all re-exported through
`models/__init__.py` so `from app.models import Employee` keeps working regardless of which
submodule actually defines it. SQLAlchemy 2.0 declarative style (`Mapped[...]`,
`mapped_column`), one `Base` from `app/database.py`.

| Module | Contents |
|---|---|
| `common.py` | `utc_now()`, `TimestampMixin` |
| `auth.py` | `UserRole` enum, `User` |
| `organization.py` | `Department`, `Designation`, `CompanyProfile` |
| `employees.py` | `EmployeeType`, `EmployeeStatus`, `CompensationType` enums; `Employee`, `SalaryRevision`, `BankDetail`, `EmployeeDocument` |
| `hiring.py` | `JobStatus`, `CandidateStage` enums; `Job`, `Candidate` |
| `projects.py` | `ProjectStatus` enum; `Project`, `ProjectAssignment` (imports `Employee` from `employees.py`) |
| `payroll.py` | `PayrollEntryStatus` enum; `PayrollEntry` (imports `Employee` from `employees.py`) |
| `activity.py` | `ActivityLog` |

For the table-by-table column reference see [[Database/Schema|Database Schema]] and its
per-domain pages ([[Database/Employees|Employees]], [[Database/Hiring|Hiring]],
[[Database/Projects|Projects]], [[Database/Payroll|Payroll]]). This page covers modeling
patterns used across the package.

## Cross-module imports, not circular

`projects.py` and `payroll.py` each import `Employee` from `employees.py` for their
`relationship()` type hints; `employees.py` imports `Department`/`Designation` from
`organization.py`. There is no import cycle — `organization.py` and `auth.py` are leaves,
`employees.py` depends only on `organization.py`, and `projects.py`/`payroll.py` depend only on
`employees.py`. If a new cross-domain relationship would create a cycle, that's a signal the
entity boundary is wrong — see [[AI Coding Conventions]] §4.

## Shared building blocks

```python
def utc_now() -> datetime:
    return datetime.now(UTC)

class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
```

Every model except `ActivityLog` inherits `TimestampMixin`. `ActivityLog` only has
`timestamp` (append-only, never updated).

## Enums

All enums are plain `class X(str, Enum)` — this makes them JSON-serializable as their string
value and usable directly as SQLAlchemy `Enum(X)` (native Postgres enum type) *and* as Pydantic
field types in `schemas/` without conversion. Full enum-to-value table in
[[Database/Schema|Database Schema]].

## Model → table map

| Model class | Module | Table | Notes |
|---|---|---|---|
| `User` | `auth.py` | `users` | portal login account |
| `Department`, `Designation` | `organization.py` | `departments`, `designations` | |
| `CompanyProfile` | `organization.py` | `company_profiles` | modeled + seeded, never read — [[Known Limitations]] |
| `Job`, `Candidate` | `hiring.py` | `jobs`, `candidates` | |
| `Employee` | `employees.py` | `employees` | has computed `@property full_name` (not a column) |
| `SalaryRevision` | `employees.py` | `salary_revisions` | |
| `BankDetail` | `employees.py` | `bank_details` | modeled, no endpoints — [[Known Limitations]] |
| `EmployeeDocument` | `employees.py` | `employee_documents` | |
| `Project`, `ProjectAssignment` | `projects.py` | `projects`, `project_assignments` | |
| `PayrollEntry` | `payroll.py` | `payroll_entries` | |
| `ActivityLog` | `activity.py` | `activity_logs` | no `TimestampMixin`, single `timestamp` column, no actor — see [[Backend/Services\|Services]] |

## Relationships defined

```python
# Employee (employees.py)
department: Mapped[Department | None] = relationship()
designation: Mapped[Designation | None] = relationship()
salary_revisions: Mapped[list[SalaryRevision]] = relationship(
    back_populates="employee", cascade="all, delete-orphan",
    order_by="SalaryRevision.effective_date",
)
bank_detail: Mapped[BankDetail | None] = relationship(
    back_populates="employee", cascade="all, delete-orphan", uselist=False,
)

# Project (projects.py)
assignments: Mapped[list[ProjectAssignment]] = relationship(
    back_populates="project", cascade="all, delete-orphan",
)

# Job (hiring.py)
candidates: Mapped[list[Candidate]] = relationship(
    back_populates="job", cascade="all, delete-orphan",
)
```

`salary_revisions` is always loaded ordered by `effective_date` ascending, which is why
[[Backend/Services|Services]]`.employee_current_salary()` can just take the `max()` of the
eligible ones rather than re-querying.

Elsewhere (`ProjectAssignment.employee`, `PayrollEntry.employee`,
`Candidate.job`) relationships are declared one-directional (no `back_populates`) since the
reverse side isn't needed by the app.

## `full_name` — computed, not stored

```python
@property
def full_name(self) -> str:
    return f"{self.first_name} {self.last_name}".strip()
```

Used directly by `serialize_employee()` in `api/routes/employees.py` (and imported into
`api/routes/hiring.py` for the convert-candidate response) and by every place a project/payroll
serializer needs an employee's display name (`item.employee.full_name`).

## Loading strategy

Routes and `repositories/*.py` explicitly `selectinload()` the relationships needed for
serialization (e.g. `repositories/employees.py: get_employee_detailed()` loads
`selectinload(Employee.designation), selectinload(Employee.salary_revisions)`) — there is no
lazy-loading surprise in request handlers because sessions close at the end of the request
(`database.py: get_db()`).

## Related

[[Database/Schema|Database Schema]] · [[Backend/API|Backend API]] ·
[[Backend/Architecture|Backend Architecture]] · [[Backend/Services|Backend Services]] ·
[[AI Coding Conventions]]
