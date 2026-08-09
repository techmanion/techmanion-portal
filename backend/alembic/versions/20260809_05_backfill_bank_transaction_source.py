"""Correct bank_transactions.source for rows that pre-date that column.

The previous migration (20260809_04) could only infer `source = 'TRANSFER'` for
existing rows, since transfer legs are the only ones self-identifying via
`transfer_id`. Every other pre-existing transaction — including ones that are
genuinely linked to an expense, project payment, or payroll entry — was left
defaulted to `'MANUAL'`, which makes the new reconciliation UI misreport them as
unreconciled. This migration re-derives the correct source from the existing
`bank_transaction_id` foreign keys on `expenses`, `project_payments`, and
`payroll_entries`. No rows are added, removed, or otherwise altered besides this
column; transfer legs (already correctly tagged) are left untouched.

Revision ID: 20260809_05
Revises: 20260809_04
"""

from alembic import op

revision = "20260809_05"
down_revision = "20260809_04"
branch_labels = None
depends_on = None

_LINKS = (
    ("expenses", "EXPENSE"),
    ("project_payments", "INCOME"),
    ("payroll_entries", "PAYROLL"),
)


def upgrade() -> None:
    for table, source in _LINKS:
        op.execute(
            f"""
            UPDATE bank_transactions
            SET source = '{source}'
            WHERE source = 'MANUAL'
              AND id IN (
                  SELECT bank_transaction_id FROM {table}
                  WHERE bank_transaction_id IS NOT NULL
              )
            """
        )


def downgrade() -> None:
    for table, source in _LINKS:
        op.execute(
            f"""
            UPDATE bank_transactions
            SET source = 'MANUAL'
            WHERE source = '{source}'
              AND id IN (
                  SELECT bank_transaction_id FROM {table}
                  WHERE bank_transaction_id IS NOT NULL
              )
            """
        )
