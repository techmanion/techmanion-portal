"""Enrich activity logs with actor/metadata and tag bank transaction sources.

Revision ID: 20260809_04
Revises: 20260809_03
"""

from alembic import op
import sqlalchemy as sa

revision = "20260809_04"
down_revision = "20260809_03"
branch_labels = None
depends_on = None

transaction_source_enum = sa.Enum(
    "MANUAL", "EXPENSE", "INCOME", "PAYROLL", "TRANSFER", name="transactionsource"
)


def upgrade() -> None:
    op.alter_column("activity_logs", "entity", new_column_name="entity_type")
    op.add_column(
        "activity_logs",
        sa.Column("performed_by_user_id", sa.Integer(), nullable=True),
    )
    op.add_column("activity_logs", sa.Column("metadata_json", sa.JSON(), nullable=True))
    op.create_foreign_key(
        "fk_activity_logs_performed_by_user_id",
        "activity_logs",
        "users",
        ["performed_by_user_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        op.f("ix_activity_logs_entity_type"), "activity_logs", ["entity_type"], unique=False
    )
    op.create_index(
        op.f("ix_activity_logs_action"), "activity_logs", ["action"], unique=False
    )
    op.create_index(
        op.f("ix_activity_logs_timestamp"), "activity_logs", ["timestamp"], unique=False
    )
    op.create_index(
        op.f("ix_activity_logs_performed_by_user_id"),
        "activity_logs",
        ["performed_by_user_id"],
        unique=False,
    )

    transaction_source_enum.create(op.get_bind(), checkfirst=True)
    op.add_column(
        "bank_transactions",
        sa.Column(
            "source",
            transaction_source_enum,
            nullable=False,
            server_default="MANUAL",
        ),
    )
    op.execute("UPDATE bank_transactions SET source = 'TRANSFER' WHERE transfer_id IS NOT NULL")
    op.alter_column("bank_transactions", "source", server_default=None)


def downgrade() -> None:
    op.drop_column("bank_transactions", "source")
    transaction_source_enum.drop(op.get_bind(), checkfirst=True)

    op.drop_index(op.f("ix_activity_logs_performed_by_user_id"), table_name="activity_logs")
    op.drop_index(op.f("ix_activity_logs_timestamp"), table_name="activity_logs")
    op.drop_index(op.f("ix_activity_logs_action"), table_name="activity_logs")
    op.drop_index(op.f("ix_activity_logs_entity_type"), table_name="activity_logs")
    op.drop_constraint(
        "fk_activity_logs_performed_by_user_id", "activity_logs", type_="foreignkey"
    )
    op.drop_column("activity_logs", "metadata_json")
    op.drop_column("activity_logs", "performed_by_user_id")
    op.alter_column("activity_logs", "entity_type", new_column_name="entity")
