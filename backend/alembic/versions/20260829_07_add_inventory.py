"""Add inventory items and lifecycle events.

Revision ID: 20260829_07
Revises: 20260818_06
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260829_07"
down_revision = "20260818_06"
branch_labels = None
depends_on = None

inventory_category = postgresql.ENUM(
    "LAPTOP",
    "MONITOR",
    "KEYBOARD",
    "MOUSE",
    "CHAIR",
    "DESK",
    "HEADSET",
    "PHONE",
    "CABLE",
    "OTHER",
    name="inventorycategory",
    create_type=False,
)
inventory_status = postgresql.ENUM(
    "AVAILABLE",
    "IN_USE",
    "IN_REPAIR",
    "RETIRED",
    name="inventorystatus",
    create_type=False,
)
inventory_condition = postgresql.ENUM(
    "NEW",
    "GOOD",
    "FAIR",
    "POOR",
    name="inventorycondition",
    create_type=False,
)
inventory_event_type = postgresql.ENUM(
    "RECEIVED",
    "PLACED",
    "RETURNED",
    "SENT_TO_REPAIR",
    "REPAIRED",
    "RETIRED",
    "UPDATED",
    name="inventoryeventtype",
    create_type=False,
)


def upgrade() -> None:
    bind = op.get_bind()
    postgresql.ENUM(
        "LAPTOP",
        "MONITOR",
        "KEYBOARD",
        "MOUSE",
        "CHAIR",
        "DESK",
        "HEADSET",
        "PHONE",
        "CABLE",
        "OTHER",
        name="inventorycategory",
    ).create(bind, checkfirst=True)
    postgresql.ENUM(
        "AVAILABLE",
        "IN_USE",
        "IN_REPAIR",
        "RETIRED",
        name="inventorystatus",
    ).create(bind, checkfirst=True)
    postgresql.ENUM(
        "NEW",
        "GOOD",
        "FAIR",
        "POOR",
        name="inventorycondition",
    ).create(bind, checkfirst=True)
    postgresql.ENUM(
        "RECEIVED",
        "PLACED",
        "RETURNED",
        "SENT_TO_REPAIR",
        "REPAIRED",
        "RETIRED",
        "UPDATED",
        name="inventoryeventtype",
    ).create(bind, checkfirst=True)

    op.create_table(
        "inventory_items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("asset_tag", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("category", inventory_category, nullable=False),
        sa.Column("status", inventory_status, nullable=False),
        sa.Column("condition", inventory_condition, nullable=False),
        sa.Column("serial_number", sa.String(length=120), nullable=True),
        sa.Column("location", sa.String(length=160), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("purchased_on", sa.Date(), nullable=True),
        sa.Column("warranty_until", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("asset_tag"),
    )
    op.create_index(
        op.f("ix_inventory_items_asset_tag"), "inventory_items", ["asset_tag"], unique=False
    )

    op.create_table(
        "inventory_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("item_id", sa.Integer(), nullable=False),
        sa.Column("event_type", inventory_event_type, nullable=False),
        sa.Column("from_status", inventory_status, nullable=True),
        sa.Column("to_status", inventory_status, nullable=True),
        sa.Column("location", sa.String(length=160), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("performed_by_user_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["item_id"], ["inventory_items.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_inventory_events_item_id"), "inventory_events", ["item_id"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_inventory_events_item_id"), table_name="inventory_events")
    op.drop_table("inventory_events")
    op.drop_index(op.f("ix_inventory_items_asset_tag"), table_name="inventory_items")
    op.drop_table("inventory_items")
    bind = op.get_bind()
    postgresql.ENUM(name="inventoryeventtype").drop(bind, checkfirst=True)
    postgresql.ENUM(name="inventorycondition").drop(bind, checkfirst=True)
    postgresql.ENUM(name="inventorystatus").drop(bind, checkfirst=True)
    postgresql.ENUM(name="inventorycategory").drop(bind, checkfirst=True)
