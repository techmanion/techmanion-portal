from datetime import date
from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import AuditLog, Employee, SalaryRevision, TaxSlab, User


def employee_current_salary(
    employee: Employee, on_date: date | None = None
) -> SalaryRevision | None:
    target = on_date or date.today()
    eligible = [row for row in employee.salary_revisions if row.effective_date <= target]
    return max(eligible, key=lambda row: row.effective_date) if eligible else None


def monthly_tax(db: Session, monthly_base: int, period_month: str) -> int:
    """Calculate withholding in minor units from annual minor-unit tax slabs."""
    year = int(period_month[:4])
    fiscal_year = f"{year}-{str(year + 1)[-2:]}"
    annual = monthly_base * 12
    slabs = db.scalars(
        select(TaxSlab)
        .where(TaxSlab.fiscal_year == fiscal_year)
        .order_by(TaxSlab.lower_bound.desc())
    ).all()
    slab = next(
        (
            item
            for item in slabs
            if annual >= item.lower_bound
            and (item.upper_bound is None or annual <= item.upper_bound)
        ),
        None,
    )
    if not slab:
        return 0
    excess = max(0, annual - slab.lower_bound)
    annual_tax = Decimal(slab.fixed_amount) + (
        Decimal(excess) * Decimal(slab.rate_bps_over_lower) / Decimal(10000)
    )
    return int((annual_tax / Decimal(12)).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def audit(
    db: Session,
    actor: User,
    action: str,
    entity_type: str,
    entity_id: int | str,
    *,
    before: dict | None = None,
    after: dict | None = None,
) -> None:
    db.add(
        AuditLog(
            actor_user_id=actor.id,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id),
            before=before,
            after=after,
        )
    )
