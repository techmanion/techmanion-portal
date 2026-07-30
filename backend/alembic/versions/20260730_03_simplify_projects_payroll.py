"""Simplify Project and Payroll modules for Phase 1.

Revision ID: 20260730_03
Revises: 20260730_02
"""

from alembic import op
import sqlalchemy as sa
from app import models  # noqa: F401
from app.database import Base

revision = "20260730_03"
down_revision = "20260730_02"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "payroll_runs" in tables:
        for table in ("payslip_line_items", "payslips", "payroll_runs", "tax_slabs"):
            if table in tables:
                op.drop_table(table)
        if bind.dialect.name == "postgresql":
            op.execute("DROP TYPE IF EXISTS payrollstatus")
            op.execute("DROP TYPE IF EXISTS paymentstatus")
            op.execute("DROP TYPE IF EXISTS lineitemtype")

    project_columns = (
        {column["name"] for column in inspector.get_columns("projects")}
        if "projects" in tables
        else set()
    )
    if {"contract_value", "trello_url"} & project_columns:
        if "project_assignments" in tables:
            op.drop_table("project_assignments")
        op.drop_table("projects")
        if bind.dialect.name == "postgresql":
            op.execute("DROP TYPE IF EXISTS projectstatus")

    Base.metadata.create_all(bind=bind)


def downgrade() -> None:
    bind = op.get_bind()
    tables = set(sa.inspect(bind).get_table_names())
    for table in ("payroll_entries", "project_assignments", "projects"):
        if table in tables:
            Base.metadata.tables[table].drop(bind=bind)
    if bind.dialect.name == "postgresql":
        op.execute("DROP TYPE IF EXISTS projectstatus")
        op.execute("DROP TYPE IF EXISTS payrollentrystatus")
