---
tags: [backend]
---

# Backend Models

Source: `backend/app/models.py`. SQLAlchemy 2.0 declarative style (`Mapped[...]`,
`mapped_column`), one `Base` from `app/database.py`.

For the table-by-table column reference see [[Database/Schema|Database Schema]] and its
per-domain pages ([[Database/Employees|Employees]], [[Database/Hiring|Hiring]],
[[Database/Projects|Projects]], [[Database/Payroll|Payroll]]). This page covers modeling
patterns used across the file.

## Shared building blocks

```python
def utc_now() -> datetime:
    return datetime.now(UTC)

class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
```

Every model except `AuditLog` inherits `TimestampMixin` (`class Employee(TimestampMixin,
Base)`, etc.). `AuditLog` only has `created_at` (append-only, never updated).

## Enums

All enums are plain `class X(str, Enum)` — this makes them JSON-serializable as their string
value and usable directly as SQLAlchemy `Enum(X)` (native Postgres enum type) *and* as Pydantic
field types in `schemas.py` without conversion. Full enum-to-value table in
[[Database/Schema|Database Schema]].

## Model → table map

| Model class | Table | Notes |
|---|---|---|
| `User` | `users` | portal login account |
| `Department`, `Designation` | `departments`, `designations` | |
| `Job`, `Candidate` | `jobs`, `candidates` | |
| `Employee` | `employees` | has computed `@property full_name` (not a column) |
| `SalaryRevision` | `salary_revisions` | |
| `BankDetail` | `bank_details` | modeled, no endpoints — [[Known Limitations]] |
| `EmployeeDocument` | `employee_documents` | |
| `Project`, `ProjectAssignment` | `projects`, `project_assignments` | |
| `PayrollEntry` | `payroll_entries` | |
| `CompanyProfile` | `company_profiles` | modeled + seeded, never read — [[Known Limitations]] |
| `AuditLog` | `audit_logs` | no `TimestampMixin`, no `updated_at` |

## Relationships defined

```python
# Employee
department: Mapped[Department | None] = relationship()
designation: Mapped[Designation | None] = relationship()
salary_revisions: Mapped[list[SalaryRevision]] = relationship(
    back_populates="employee", cascade="all, delete-orphan",
    order_by="SalaryRevision.effective_date",
)
bank_detail: Mapped[BankDetail | None] = relationship(
    back_populates="employee", cascade="all, delete-orphan", uselist=False,
)

# Project
assignments: Mapped[list[ProjectAssignment]] = relationship(
    back_populates="project", cascade="all, delete-orphan",
)

# Job
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

Used directly by `serialize_employee()` in `api.py` and by every place a project/payroll
serializer needs an employee's display name (`item.employee.full_name`).

## Loading strategy

`api.py` explicitly `selectinload()`s relationships needed for serialization (e.g.
`selectinload(Employee.department), selectinload(Employee.designation),
selectinload(Employee.salary_revisions)` on every employee query) — there is no lazy-loading
surprise in request handlers because sessions close at the end of the request
(`database.py: get_db()`).

## Related

[[Database/Schema|Database Schema]] · [[Backend/API|Backend API]] ·
[[Backend/Architecture|Backend Architecture]] · [[Backend/Services|Backend Services]]
