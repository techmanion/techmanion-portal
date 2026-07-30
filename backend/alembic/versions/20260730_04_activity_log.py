"""Replace the audit log with the Phase 1 Home activity log.

Revision ID: 20260730_04
Revises: 20260730_03
"""

import sqlalchemy as sa
from alembic import op

revision = "20260730_04"
down_revision = "20260730_03"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    tables = set(sa.inspect(bind).get_table_names())
    if "audit_logs" in tables:
        op.drop_table("audit_logs")
    if "activity_logs" not in tables:
        op.create_table(
            "activity_logs",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("entity", sa.String(length=100), nullable=False),
            sa.Column("entity_id", sa.String(length=80), nullable=False),
            sa.Column("action", sa.String(length=32), nullable=False),
            sa.Column("description", sa.Text(), nullable=False),
            sa.Column(
                "timestamp",
                sa.DateTime(timezone=True),
                nullable=False,
            ),
        )


def downgrade() -> None:
    bind = op.get_bind()
    tables = set(sa.inspect(bind).get_table_names())
    if "activity_logs" in tables:
        op.drop_table("activity_logs")
    if "audit_logs" not in tables:
        op.create_table(
            "audit_logs",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("actor_user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("action", sa.String(length=100), nullable=False),
            sa.Column("entity_type", sa.String(length=100), nullable=False),
            sa.Column("entity_id", sa.String(length=80), nullable=False),
            sa.Column("before", sa.JSON(), nullable=True),
            sa.Column("after", sa.JSON(), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                nullable=False,
            ),
        )
