from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.inventory import (
    InventoryCategory,
    InventoryCondition,
    InventoryItem,
    InventoryStatus,
)


def item_detail_options():
    return (selectinload(InventoryItem.events),)


def list_inventory_items(
    db: Session,
    *,
    search: str | None = None,
    category: InventoryCategory | None = None,
    status: InventoryStatus | None = None,
    condition: InventoryCondition | None = None,
) -> list[InventoryItem]:
    statement: Select[tuple[InventoryItem]] = select(InventoryItem).order_by(
        InventoryItem.asset_tag.desc()
    )
    if search:
        term = f"%{search.strip()}%"
        statement = statement.where(
            or_(
                InventoryItem.name.ilike(term),
                InventoryItem.asset_tag.ilike(term),
                InventoryItem.serial_number.ilike(term),
                InventoryItem.location.ilike(term),
            )
        )
    if category:
        statement = statement.where(InventoryItem.category == category)
    if status:
        statement = statement.where(InventoryItem.status == status)
    if condition:
        statement = statement.where(InventoryItem.condition == condition)
    return list(db.scalars(statement).all())


def get_inventory_item(db: Session, item_id: int) -> InventoryItem | None:
    statement = (
        select(InventoryItem)
        .where(InventoryItem.id == item_id)
        .options(*item_detail_options())
    )
    return db.scalar(statement)


def list_all_items(db: Session) -> list[InventoryItem]:
    return list(db.scalars(select(InventoryItem).order_by(InventoryItem.asset_tag)).all())


def next_asset_tag_number(db: Session) -> int:
    statement = select(func.max(InventoryItem.asset_tag))
    latest = db.scalar(statement)
    if not latest:
        return 1
    try:
        return int(latest.rsplit("-", 1)[-1]) + 1
    except ValueError:
        return 1


def format_asset_tag(number: int) -> str:
    return f"TM-INV-{number:04d}"
