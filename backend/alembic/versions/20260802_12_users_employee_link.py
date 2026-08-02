"""Link users to their employee record (core members only use the portal).

Revision ID: 20260802_12
Revises: 20260802_11
"""

import sqlalchemy as sa
from alembic import op

revision = "20260802_12"
down_revision = "20260802_11"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("employee_id", sa.Integer(), nullable=True))
    op.create_unique_constraint("uq_users_employee_id", "users", ["employee_id"])
    op.create_foreign_key(
        "fk_users_employee_id_employees",
        "users",
        "employees",
        ["employee_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_users_employee_id_employees", "users", type_="foreignkey")
    op.drop_constraint("uq_users_employee_id", "users", type_="unique")
    op.drop_column("users", "employee_id")
