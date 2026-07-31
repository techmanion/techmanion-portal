"""Add organization profile fields to company_profiles.

Revision ID: 20260801_06
Revises: 20260801_05
"""

import sqlalchemy as sa
from alembic import op

revision = "20260801_06"
down_revision = "20260801_05"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("company_profiles", sa.Column("legal_name", sa.String(length=160), nullable=True))
    op.add_column("company_profiles", sa.Column("email", sa.String(length=255), nullable=True))
    op.add_column("company_profiles", sa.Column("phone", sa.String(length=40), nullable=True))
    op.add_column("company_profiles", sa.Column("website", sa.String(length=255), nullable=True))
    op.add_column(
        "company_profiles",
        sa.Column("timezone", sa.String(length=60), nullable=False, server_default="UTC"),
    )
    op.alter_column("company_profiles", "timezone", server_default=None)


def downgrade() -> None:
    op.drop_column("company_profiles", "timezone")
    op.drop_column("company_profiles", "website")
    op.drop_column("company_profiles", "phone")
    op.drop_column("company_profiles", "email")
    op.drop_column("company_profiles", "legal_name")
