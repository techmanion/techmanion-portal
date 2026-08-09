"""Add bank accounts and bank transactions.

Revision ID: 20260809_02
Revises: 20260809_01
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260809_02"
down_revision = "20260809_01"
branch_labels = None
depends_on = None

currency_enum = postgresql.ENUM(
    "PKR", "USD", "EUR", "GBP", name="currency", create_type=False
)
transaction_type_enum = sa.Enum("CREDIT", "DEBIT", name="transactiontype")


def upgrade() -> None:
    op.create_table(
        "bank_accounts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("bank_name", sa.String(length=160), nullable=False),
        sa.Column("currency", currency_enum, nullable=False),
        sa.Column("opening_balance", sa.BigInteger(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("account_identifier", sa.String(length=160), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "bank_transactions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("bank_account_id", sa.Integer(), nullable=False),
        sa.Column("transaction_type", transaction_type_enum, nullable=False),
        sa.Column("transaction_date", sa.Date(), nullable=False),
        sa.Column("amount", sa.BigInteger(), nullable=False),
        sa.Column("pkr_equivalent", sa.BigInteger(), nullable=False),
        sa.Column("description", sa.String(length=200), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("transfer_id", sa.String(length=36), nullable=True),
        sa.Column("counterparty_account_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["bank_account_id"], ["bank_accounts.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["counterparty_account_id"], ["bank_accounts.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_bank_transactions_transfer_id"),
        "bank_transactions",
        ["transfer_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_bank_transactions_transfer_id"), table_name="bank_transactions"
    )
    op.drop_table("bank_transactions")
    op.drop_table("bank_accounts")
    transaction_type_enum.drop(op.get_bind(), checkfirst=True)
