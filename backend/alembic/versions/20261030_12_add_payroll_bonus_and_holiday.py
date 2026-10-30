"""Add bonus and holiday work compensation to payroll entries.

Revision ID: 20261030_12
Revises: 20261030_11
"""

from alembic import op
import sqlalchemy as sa

revision = "20261030_12"
down_revision = "20261030_11"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "payroll_entries",
        sa.Column("bonus", sa.BigInteger(), nullable=False, server_default="0"),
    )
    op.add_column(
        "payroll_entries",
        sa.Column("holiday_compensation", sa.BigInteger(), nullable=False, server_default="0"),
    )


def downgrade() -> None:
    op.drop_column("payroll_entries", "holiday_compensation")
    op.drop_column("payroll_entries", "bonus")
