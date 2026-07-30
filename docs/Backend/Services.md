---
tags: [backend]
---

# Backend Services

Source: `backend/app/services.py` — deliberately small. This is not a service-layer
architecture; it's two shared helper functions that would otherwise be duplicated across
`api.py` handlers.

## `employee_current_salary(employee, on_date=None) -> SalaryRevision | None`

```python
def employee_current_salary(employee: Employee, on_date: date | None = None) -> SalaryRevision | None:
    target = on_date or date.today()
    eligible = [row for row in employee.salary_revisions if row.effective_date <= target]
    return max(eligible, key=lambda row: row.effective_date) if eligible else None
```

- Operates on an **already-loaded** Python list (`employee.salary_revisions`), not a fresh
  query — callers must `selectinload(Employee.salary_revisions)` first.
- "Current" salary = the revision with the latest `effective_date` that is `<=` the target
  date. Future-dated revisions are ignored until their date arrives.
- Returns `None` if the employee has no eligible revision (e.g. brand-new employee whose only
  revision is dated in the future — shouldn't normally happen since employee creation always
  back-dates the first revision to `joining_date`).

**Callers:**
- `serialize_employee()` in `api.py` → populates `EmployeeOut.currentSalary` for every
  employee list/detail response.
- `generate_payroll()` in `api.py` → looks up salary as of the 28th of the target payroll
  month for each active employee. See [[Database/Payroll|Database Payroll]].

Unit-tested in `backend/tests/test_services.py`.

## `audit(db, actor, action, entity_type, entity_id, *, before=None, after=None) -> None`

```python
def audit(db, actor, action, entity_type, entity_id, *, before=None, after=None) -> None:
    db.add(AuditLog(
        actor_user_id=actor.id, action=action, entity_type=entity_type,
        entity_id=str(entity_id), before=before, after=after,
    ))
```

- Adds an `AuditLog` row to the **same SQLAlchemy session** as the change being recorded — it
  is committed together with the surrounding `db.commit()`, so an audit entry and the change it
  describes are always transactionally consistent (either both land or neither does).
- `before`/`after` are arbitrary JSON-serializable dicts, usually a small snapshot of the
  changed fields (not the full row).
- Called directly from `api.py` handlers, never from `services.py` itself or automatically —
  each handler that wants an audit trail calls it explicitly.

### Every `action` string currently emitted

| Action | Emitted from |
|---|---|
| `user.profile_updated`, `user.password_changed`, `user.created`, `user.updated` | Auth/Team endpoints |
| `employee.created`, `employee.updated`, `salary.revised` | Employee endpoints |
| `job.created`, `job.updated`, `job.deleted` | Job endpoints |
| `candidate.created`, `candidate.updated`, `candidate.deleted`, `candidate.converted` | Candidate endpoints |
| `project.created`, `project.updated`, `project.deleted`, `project.employee_assigned`, `project.employee_removed` | Project endpoints |
| `payroll.entry_created`, `payroll.entry_updated`, `payroll.entry_deleted`, `payroll.entry_paid`, `payroll.generated` | Payroll endpoints |

Read back via `GET /audit` (Admin-only) — see [[Backend/API|Backend API]] and
[[Features/Settings|Settings feature]].

## Related

[[Backend/API|Backend API]] · [[Backend/Models|Backend Models]] ·
[[Backend/Architecture|Backend Architecture]] · [[Database/Payroll|Database Payroll]]
