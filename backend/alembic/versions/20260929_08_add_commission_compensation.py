"""Add commission compensation fields.

Revision ID: 20260929_08
Revises: 20260829_07
"""

from alembic import op
import sqlalchemy as sa

revision = "20260929_08"
down_revision = "20260829_07"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE compensationtype ADD VALUE IF NOT EXISTS 'COMMISSION'")

    op.add_column(
        "salary_revisions",
        sa.Column("commission_rate", sa.Numeric(5, 2), nullable=True),
    )
    op.add_column(
        "salary_revisions",
        sa.Column("commission_basis", sa.String(length=120), nullable=True),
    )
    op.add_column(
        "payroll_entries",
        sa.Column("commission_amount", sa.BigInteger(), nullable=False, server_default="0"),
    )
    op.alter_column("payroll_entries", "commission_amount", server_default=None)


def downgrade() -> None:
    op.drop_column("payroll_entries", "commission_amount")
    op.drop_column("salary_revisions", "commission_basis")
    op.drop_column("salary_revisions", "commission_rate")
    # Postgres cannot drop a single value from an enum type; COMMISSION is left in place.
