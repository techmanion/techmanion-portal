"""Add leads table for public contact-form submissions.

Revision ID: 20261022_10
Revises: 20261001_09
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20261022_10"
down_revision = "20261001_09"
branch_labels = None
depends_on = None

lead_audience = postgresql.ENUM("FOUNDER", "BUSINESS", name="leadaudience", create_type=False)
lead_status = postgresql.ENUM(
    "NEW", "CONTACTED", "QUALIFIED", "ARCHIVED", name="leadstatus", create_type=False
)


def upgrade() -> None:
    bind = op.get_bind()
    postgresql.ENUM("FOUNDER", "BUSINESS", name="leadaudience").create(bind, checkfirst=True)
    postgresql.ENUM(
        "NEW", "CONTACTED", "QUALIFIED", "ARCHIVED", name="leadstatus"
    ).create(bind, checkfirst=True)

    op.create_table(
        "leads",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("company", sa.String(length=160), nullable=True),
        sa.Column("goal", sa.Text(), nullable=True),
        sa.Column("audience", lead_audience, nullable=False),
        sa.Column("status", lead_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_leads_email"), "leads", ["email"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_leads_email"), table_name="leads")
    op.drop_table("leads")
    bind = op.get_bind()
    postgresql.ENUM(name="leadstatus").drop(bind, checkfirst=True)
    postgresql.ENUM(name="leadaudience").drop(bind, checkfirst=True)
