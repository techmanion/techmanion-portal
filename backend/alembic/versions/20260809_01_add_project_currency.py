"""Add currency to projects.

Revision ID: 20260809_01
Revises: 20260802_01
"""

from alembic import op
import sqlalchemy as sa

revision = "20260809_01"
down_revision = "20260802_01"
branch_labels = None
depends_on = None

currency_enum = sa.Enum("PKR", "USD", "EUR", "GBP", name="currency")


def upgrade() -> None:
    currency_enum.create(op.get_bind(), checkfirst=True)
    op.add_column(
        "projects",
        sa.Column("currency", currency_enum, nullable=False, server_default="PKR"),
    )
    op.alter_column("projects", "currency", server_default=None)


def downgrade() -> None:
    op.drop_column("projects", "currency")
    currency_enum.drop(op.get_bind(), checkfirst=True)
