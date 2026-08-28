from __future__ import annotations

from datetime import date, datetime
from enum import Enum

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.common import TimestampMixin, utc_now

__all__ = [
    "InventoryCategory",
    "InventoryCondition",
    "InventoryEvent",
    "InventoryEventType",
    "InventoryItem",
    "InventoryStatus",
]


class InventoryCategory(str, Enum):
    LAPTOP = "LAPTOP"
    MONITOR = "MONITOR"
    KEYBOARD = "KEYBOARD"
    MOUSE = "MOUSE"
    CHAIR = "CHAIR"
    DESK = "DESK"
    HEADSET = "HEADSET"
    PHONE = "PHONE"
    CABLE = "CABLE"
    OTHER = "OTHER"


class InventoryStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    IN_USE = "IN_USE"
    IN_REPAIR = "IN_REPAIR"
    RETIRED = "RETIRED"


class InventoryCondition(str, Enum):
    NEW = "NEW"
    GOOD = "GOOD"
    FAIR = "FAIR"
    POOR = "POOR"


class InventoryEventType(str, Enum):
    RECEIVED = "RECEIVED"
    PLACED = "PLACED"
    RETURNED = "RETURNED"
    SENT_TO_REPAIR = "SENT_TO_REPAIR"
    REPAIRED = "REPAIRED"
    RETIRED = "RETIRED"
    UPDATED = "UPDATED"


class InventoryItem(TimestampMixin, Base):
    __tablename__ = "inventory_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    asset_tag: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(160))
    category: Mapped[InventoryCategory] = mapped_column(SqlEnum(InventoryCategory))
    status: Mapped[InventoryStatus] = mapped_column(
        SqlEnum(InventoryStatus), default=InventoryStatus.AVAILABLE
    )
    condition: Mapped[InventoryCondition] = mapped_column(
        SqlEnum(InventoryCondition), default=InventoryCondition.GOOD
    )
    serial_number: Mapped[str | None] = mapped_column(String(120), nullable=True)
    location: Mapped[str | None] = mapped_column(String(160), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    purchased_on: Mapped[date | None] = mapped_column(Date, nullable=True)
    warranty_until: Mapped[date | None] = mapped_column(Date, nullable=True)

    events: Mapped[list[InventoryEvent]] = relationship(
        back_populates="item",
        cascade="all, delete-orphan",
        order_by="InventoryEvent.created_at.desc()",
    )


class InventoryEvent(Base):
    __tablename__ = "inventory_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    item_id: Mapped[int] = mapped_column(
        ForeignKey("inventory_items.id", ondelete="CASCADE"), index=True
    )
    event_type: Mapped[InventoryEventType] = mapped_column(SqlEnum(InventoryEventType))
    from_status: Mapped[InventoryStatus | None] = mapped_column(
        SqlEnum(InventoryStatus), nullable=True
    )
    to_status: Mapped[InventoryStatus | None] = mapped_column(
        SqlEnum(InventoryStatus), nullable=True
    )
    location: Mapped[str | None] = mapped_column(String(160), nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    performed_by_user_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    item: Mapped[InventoryItem] = relationship(back_populates="events")
