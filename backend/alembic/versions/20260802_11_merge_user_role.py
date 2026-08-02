"""Merge users.role (UserRole: ADMIN/HR/MANAGER/EMPLOYEE) into EmployeeType.

ADMIN becomes EXECUTIVE (full access); HR/MANAGER/EMPLOYEE collapse to EMPLOYEE
(standard access). The employeetype enum already exists (employees.employee_type).

Revision ID: 20260802_11
Revises: 20260802_10
"""

import sqlalchemy as sa
from alembic import op

revision = "20260802_11"
down_revision = "20260802_10"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE users ALTER COLUMN role DROP DEFAULT")
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE text USING role::text")
    op.execute(
        "UPDATE users SET role = CASE role "
        "WHEN 'ADMIN' THEN 'EXECUTIVE' "
        "ELSE 'EMPLOYEE' END"
    )
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE employeetype USING role::employeetype")
    op.execute("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'EMPLOYEE'")
    op.execute("DROP TYPE userrole")


def downgrade() -> None:
    bind = op.get_bind()
    old_enum = sa.Enum("ADMIN", "HR", "MANAGER", "EMPLOYEE", name="userrole")
    old_enum.create(bind, checkfirst=True)
    op.execute("ALTER TABLE users ALTER COLUMN role DROP DEFAULT")
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE text USING role::text")
    op.execute(
        "UPDATE users SET role = CASE role "
        "WHEN 'EXECUTIVE' THEN 'ADMIN' "
        "ELSE 'HR' END"
    )
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE userrole USING role::userrole")
    op.execute("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'HR'")
