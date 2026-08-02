"""Add avatar_key to users and employees.

Revision ID: 20260802_10
Revises: 20260801_09
"""

import sqlalchemy as sa
from alembic import op

revision = "20260802_10"
down_revision = "20260801_09"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    users_columns = {column["name"] for column in sa.inspect(bind).get_columns("users")}
    if "avatar_key" not in users_columns:
        op.add_column("users", sa.Column("avatar_key", sa.String(length=255), nullable=True))

    employees_columns = {column["name"] for column in sa.inspect(bind).get_columns("employees")}
    if "avatar_key" not in employees_columns:
        op.add_column("employees", sa.Column("avatar_key", sa.String(length=255), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    users_columns = {column["name"] for column in sa.inspect(bind).get_columns("users")}
    if "avatar_key" in users_columns:
        op.drop_column("users", "avatar_key")

    employees_columns = {column["name"] for column in sa.inspect(bind).get_columns("employees")}
    if "avatar_key" in employees_columns:
        op.drop_column("employees", "avatar_key")
