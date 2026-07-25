from datetime import date

from app.models import Employee, SalaryRevision
from app.services import employee_current_salary


def test_current_salary_uses_latest_effective_revision() -> None:
    employee = Employee(
        first_name="Test",
        last_name="Employee",
        cnic="TEST-CNIC",
        email="employee@example.com",
        phone="0000",
        employee_type="FULL_TIME",
        joining_date=date(2025, 1, 1),
    )
    employee.salary_revisions = [
        SalaryRevision(
            base_amount=100_000_00,
            currency="PKR",
            effective_date=date(2025, 1, 1),
            created_by_user_id=1,
        ),
        SalaryRevision(
            base_amount=120_000_00,
            currency="PKR",
            effective_date=date(2026, 1, 1),
            created_by_user_id=1,
        ),
    ]

    current = employee_current_salary(employee, date(2025, 12, 1))

    assert current is not None
    assert current.base_amount == 100_000_00
