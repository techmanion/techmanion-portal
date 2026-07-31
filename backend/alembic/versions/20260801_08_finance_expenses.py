"""Add Finance expense management.

Revision ID: 20260801_08
Revises: 20260801_07
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260801_08"
down_revision = "20260801_07"
branch_labels = None
depends_on = None


def _enums(bind):
    if bind.dialect.name == "postgresql":
        return (
            postgresql.ENUM(
                "ONE_TIME", "MONTHLY_RECURRING", name="expensetype", create_type=False
            ),
            postgresql.ENUM("MONTHLY", name="expensefrequency", create_type=False),
        )
    return (
        sa.Enum("ONE_TIME", "MONTHLY_RECURRING", name="expensetype"),
        sa.Enum("MONTHLY", name="expensefrequency"),
    )


def upgrade() -> None:
    bind = op.get_bind()
    expense_type, expense_frequency = _enums(bind)
    expense_type.create(bind, checkfirst=True)
    expense_frequency.create(bind, checkfirst=True)
    if "expenses" in sa.inspect(bind).get_table_names():
        return
    op.create_table(
        "expenses",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("amount", sa.BigInteger(), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("expense_type", expense_type, nullable=False),
        sa.Column("frequency", expense_frequency, nullable=True),
        sa.Column("expense_date", sa.Date(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    bind = op.get_bind()
    expense_type, expense_frequency = _enums(bind)
    if "expenses" in sa.inspect(bind).get_table_names():
        op.drop_table("expenses")
    expense_frequency.drop(bind, checkfirst=True)
    expense_type.drop(bind, checkfirst=True)
