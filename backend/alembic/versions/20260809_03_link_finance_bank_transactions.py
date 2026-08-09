"""Link project payments, expenses, and payroll to bank transactions; add PKR opening balance.

Revision ID: 20260809_03
Revises: 20260809_02
"""

from alembic import op
import sqlalchemy as sa

revision = "20260809_03"
down_revision = "20260809_02"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "bank_accounts", sa.Column("opening_balance_pkr", sa.BigInteger(), nullable=True)
    )
    op.add_column(
        "project_payments",
        sa.Column("bank_transaction_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_project_payments_bank_transaction_id",
        "project_payments",
        "bank_transactions",
        ["bank_transaction_id"],
        ["id"],
    )
    op.add_column(
        "expenses",
        sa.Column("bank_transaction_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_expenses_bank_transaction_id",
        "expenses",
        "bank_transactions",
        ["bank_transaction_id"],
        ["id"],
    )
    op.add_column(
        "payroll_entries",
        sa.Column("bank_transaction_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_payroll_entries_bank_transaction_id",
        "payroll_entries",
        "bank_transactions",
        ["bank_transaction_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_payroll_entries_bank_transaction_id", "payroll_entries", type_="foreignkey"
    )
    op.drop_column("payroll_entries", "bank_transaction_id")
    op.drop_constraint("fk_expenses_bank_transaction_id", "expenses", type_="foreignkey")
    op.drop_column("expenses", "bank_transaction_id")
    op.drop_constraint(
        "fk_project_payments_bank_transaction_id", "project_payments", type_="foreignkey"
    )
    op.drop_column("project_payments", "bank_transaction_id")
    op.drop_column("bank_accounts", "opening_balance_pkr")
