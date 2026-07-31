"""Replace employee type taxonomy, require designation, add permanent employee IDs.

Revision ID: 20260801_05
Revises: 20260730_04
"""

from datetime import datetime, timezone

import sqlalchemy as sa
from alembic import op

revision = "20260801_05"
down_revision = "20260730_04"
branch_labels = None
depends_on = None

OLD_TYPES = ("FULL_TIME", "PART_TIME", "CONTRACT")
NEW_TYPES = ("EXECUTIVE", "EMPLOYEE", "CONTRACTOR", "INTERN")
CODE_FORMAT = {
    "EXECUTIVE": ("EXE", 2),
    "EMPLOYEE": ("EMP", 5),
    "CONTRACTOR": ("CTR", 5),
    "INTERN": ("INT", 5),
}


def upgrade() -> None:
    bind = op.get_bind()

    # 1. Replace the employee type taxonomy (FULL_TIME/PART_TIME -> EMPLOYEE, CONTRACT -> CONTRACTOR).
    new_enum = sa.Enum(*NEW_TYPES, name="employeetype_new")
    new_enum.create(bind, checkfirst=True)
    op.add_column("employees", sa.Column("employee_type_new", new_enum, nullable=True))
    op.execute(
        "UPDATE employees SET employee_type_new = (CASE employee_type::text "
        "WHEN 'FULL_TIME' THEN 'EMPLOYEE' "
        "WHEN 'PART_TIME' THEN 'EMPLOYEE' "
        "WHEN 'CONTRACT' THEN 'CONTRACTOR' "
        "ELSE 'EMPLOYEE' END)::employeetype_new"
    )
    op.alter_column("employees", "employee_type_new", nullable=False)
    op.drop_column("employees", "employee_type")
    op.execute("DROP TYPE employeetype")
    op.execute("ALTER TYPE employeetype_new RENAME TO employeetype")
    op.alter_column("employees", "employee_type_new", new_column_name="employee_type")

    # 2. Designation becomes required; backfill any existing gaps with the first known designation.
    op.execute(
        "UPDATE employees SET designation_id = (SELECT id FROM designations ORDER BY id LIMIT 1) "
        "WHERE designation_id IS NULL"
    )
    op.alter_column("employees", "designation_id", nullable=False)

    # 3. Permanent, per-type employee ID sequence + history.
    op.create_table(
        "employee_id_sequences",
        sa.Column("employee_type", new_enum, primary_key=True),
        sa.Column("last_number", sa.BigInteger(), nullable=False, server_default="0"),
    )
    op.create_table(
        "employee_identifiers",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "employee_id",
            sa.Integer(),
            sa.ForeignKey("employees.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("employee_type", new_enum, nullable=False),
        sa.Column("code", sa.String(length=20), nullable=False, unique=True),
        sa.Column("issued_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("retired_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(
        "ix_employee_identifiers_code", "employee_identifiers", ["code"], unique=True
    )

    # 4. Backfill a permanent ID for every pre-existing employee, oldest first.
    rows = bind.execute(sa.text("SELECT id, employee_type FROM employees ORDER BY id")).fetchall()
    counters = dict.fromkeys(NEW_TYPES, 0)
    now = datetime.now(timezone.utc)
    for employee_id, employee_type in rows:
        counters[employee_type] += 1
        prefix, width = CODE_FORMAT[employee_type]
        code = f"TM-{prefix}-{counters[employee_type]:0{width}d}"
        bind.execute(
            sa.text(
                "INSERT INTO employee_identifiers "
                "(employee_id, employee_type, code, issued_at, retired_at, created_at, updated_at) "
                "VALUES (:employee_id, :employee_type, :code, :issued_at, NULL, :issued_at, :issued_at)"
            ),
            {
                "employee_id": employee_id,
                "employee_type": employee_type,
                "code": code,
                "issued_at": now,
            },
        )
    for employee_type, count in counters.items():
        bind.execute(
            sa.text(
                "INSERT INTO employee_id_sequences (employee_type, last_number) "
                "VALUES (:employee_type, :count)"
            ),
            {"employee_type": employee_type, "count": count},
        )


def downgrade() -> None:
    op.drop_index("ix_employee_identifiers_code", table_name="employee_identifiers")
    op.drop_table("employee_identifiers")
    op.drop_table("employee_id_sequences")
    op.alter_column("employees", "designation_id", nullable=True)

    bind = op.get_bind()
    old_enum = sa.Enum(*OLD_TYPES, name="employeetype_old")
    old_enum.create(bind, checkfirst=True)
    op.add_column("employees", sa.Column("employee_type_old", old_enum, nullable=True))
    op.execute(
        "UPDATE employees SET employee_type_old = (CASE employee_type::text "
        "WHEN 'CONTRACTOR' THEN 'CONTRACT' "
        "ELSE 'FULL_TIME' END)::employeetype_old"
    )
    op.alter_column("employees", "employee_type_old", nullable=False)
    op.drop_column("employees", "employee_type")
    op.execute("DROP TYPE employeetype")
    op.execute("ALTER TYPE employeetype_old RENAME TO employeetype")
    op.alter_column("employees", "employee_type_old", new_column_name="employee_type")
