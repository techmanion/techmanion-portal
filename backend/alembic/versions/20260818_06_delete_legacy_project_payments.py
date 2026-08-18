"""Delete legacy project payments recorded before bank-account tracking existed.

Project payments (client income) predating the bank_accounts/bank_transactions
feature have no bank_transaction_id and never will — there's no source data to
attribute them to a real bank account or currency-convert them correctly. Per
product decision, this history is discarded rather than partially migrated.
Expenses and payroll entries are NOT touched by this migration: those rows stay
in place and remain visible in their own list views, and can be individually
linked to a bank account after the fact (via the expense edit flow, or the new
payroll backfill-bank endpoint for already-paid entries).

This migration is irreversible; downgrade cannot restore deleted rows.

Revision ID: 20260818_06
Revises: 20260809_05
"""

from alembic import op

revision = "20260818_06"
down_revision = "20260809_05"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("DELETE FROM project_payments")


def downgrade() -> None:
    pass
