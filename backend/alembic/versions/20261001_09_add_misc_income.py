"""Add misc_incomes table.

Revision ID: 20261001_09
Revises: 20260929_08
"""

from alembic import op
import sqlalchemy as sa

revision = "20261001_09"
down_revision = "20260929_08"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "misc_incomes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("amount", sa.BigInteger(), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("income_date", sa.Date(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("bank_transaction_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_foreign_key(
        "fk_misc_incomes_bank_transaction_id",
        "misc_incomes",
        "bank_transactions",
        ["bank_transaction_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_misc_incomes_bank_transaction_id", "misc_incomes", type_="foreignkey"
    )
    op.drop_table("misc_incomes")
