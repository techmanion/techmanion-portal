"""Expand jobs for the Phase 1 hiring workflow.

Revision ID: 20260801_09
Revises: 20260801_08
"""

import sqlalchemy as sa
from alembic import op

revision = "20260801_09"
down_revision = "20260801_08"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    existing = {column["name"] for column in sa.inspect(bind).get_columns("jobs")}
    columns = {
        "department": sa.Column("department", sa.String(length=120), nullable=True),
        "location": sa.Column("location", sa.String(length=160), nullable=True),
        "job_type": sa.Column("job_type", sa.String(length=80), nullable=True),
        "summary": sa.Column("summary", sa.Text(), nullable=True),
        "responsibilities": sa.Column("responsibilities", sa.JSON(), nullable=True),
        "requirements": sa.Column("requirements", sa.JSON(), nullable=True),
        "application_link": sa.Column("application_link", sa.String(length=500), nullable=True),
    }
    for name, column in columns.items():
        if name not in existing:
            op.add_column("jobs", column)

    defaults = {
        "department": "'General'",
        "location": "'Remote'",
        "job_type": "'Full Time'",
        "summary": "description",
        "responsibilities": "'[]'",
        "requirements": "'[]'",
    }
    for name, value in defaults.items():
        if name not in existing:
            op.execute(f"UPDATE jobs SET {name} = {value}")
            op.alter_column("jobs", name, nullable=False)


def downgrade() -> None:
    existing = {column["name"] for column in sa.inspect(op.get_bind()).get_columns("jobs")}
    for column in (
        "application_link",
        "requirements",
        "responsibilities",
        "summary",
        "job_type",
        "location",
        "department",
    ):
        if column in existing:
            op.drop_column("jobs", column)
