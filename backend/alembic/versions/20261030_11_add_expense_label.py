"""Add an optional label to expenses.

Revision ID: 20261030_11
Revises: 20261022_10
"""

from alembic import op
import sqlalchemy as sa

revision = "20261030_11"
down_revision = "20261022_10"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("expenses", sa.Column("label", sa.String(length=100), nullable=True))


def downgrade() -> None:
    op.drop_column("expenses", "label")
