"""Rebuild projects with typed billing, milestones, and payments.

Revision ID: 20260801_07
Revises: 20260801_06
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260801_07"
down_revision = "20260801_06"
branch_labels = None
depends_on = None

PROJECT_TYPES = ("MONTHLY_RECURRING", "FIXED", "HOURLY")
MILESTONE_STATUSES = ("PENDING", "IN_PROGRESS", "COMPLETED")


def _enums(bind):
    if bind.dialect.name == "postgresql":
        return (
            postgresql.ENUM(*PROJECT_TYPES, name="projecttype", create_type=False),
            postgresql.ENUM(*MILESTONE_STATUSES, name="milestonestatus", create_type=False),
        )
    return (
        sa.Enum(*PROJECT_TYPES, name="projecttype"),
        sa.Enum(*MILESTONE_STATUSES, name="milestonestatus"),
    )


def upgrade() -> None:
    bind = op.get_bind()
    project_type, milestone_status = _enums(bind)
    project_type.create(bind, checkfirst=True)
    milestone_status.create(bind, checkfirst=True)

    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())
    project_columns = {column["name"] for column in inspector.get_columns("projects")}
    columns = {
        "project_type": sa.Column("project_type", project_type, nullable=True),
        "monthly_amount": sa.Column("monthly_amount", sa.BigInteger(), nullable=True),
        "billing_day": sa.Column("billing_day", sa.Integer(), nullable=True),
        "auto_renew": sa.Column("auto_renew", sa.Boolean(), nullable=True),
        "contract_value": sa.Column("contract_value", sa.BigInteger(), nullable=True),
        "hourly_rate": sa.Column("hourly_rate", sa.BigInteger(), nullable=True),
        "estimated_hours": sa.Column("estimated_hours", sa.Numeric(10, 2), nullable=True),
        "logged_hours": sa.Column("logged_hours", sa.Numeric(10, 2), nullable=True),
    }
    for name, column in columns.items():
        if name not in project_columns:
            op.add_column("projects", column)
    if "project_type" not in project_columns:
        op.execute("UPDATE projects SET project_type = 'FIXED', contract_value = 0")
        op.alter_column("projects", "project_type", nullable=False)

    if "project_milestones" not in tables:
        op.create_table(
            "project_milestones",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column(
                "project_id",
                sa.Integer(),
                sa.ForeignKey("projects.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("name", sa.String(length=160), nullable=False),
            sa.Column("amount", sa.BigInteger(), nullable=False),
            sa.Column("due_date", sa.Date(), nullable=False),
            sa.Column("status", milestone_status, nullable=False),
            sa.Column("paid_date", sa.Date(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        )
    if "project_payments" not in tables:
        op.create_table(
            "project_payments",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column(
                "project_id",
                sa.Integer(),
                sa.ForeignKey("projects.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("amount", sa.BigInteger(), nullable=False),
            sa.Column("payment_date", sa.Date(), nullable=False),
            sa.Column("method", sa.String(length=80), nullable=False),
            sa.Column("reference", sa.String(length=160), nullable=True),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        )

    if "project_assignments" in tables:
        op.drop_table("project_assignments")


def downgrade() -> None:
    project_type, milestone_status = _enums(op.get_bind())
    op.create_table(
        "project_assignments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "project_id",
            sa.Integer(),
            sa.ForeignKey("projects.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("employee_id", sa.Integer(), sa.ForeignKey("employees.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("project_id", "employee_id"),
    )
    op.drop_table("project_payments")
    op.drop_table("project_milestones")
    for column in (
        "logged_hours",
        "estimated_hours",
        "hourly_rate",
        "contract_value",
        "auto_renew",
        "billing_day",
        "monthly_amount",
        "project_type",
    ):
        op.drop_column("projects", column)
    milestone_status.drop(op.get_bind(), checkfirst=True)
    project_type.drop(op.get_bind(), checkfirst=True)
