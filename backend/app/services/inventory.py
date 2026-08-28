from __future__ import annotations

from datetime import date, timedelta

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.auth import User
from app.models.inventory import (
    InventoryCategory,
    InventoryEvent,
    InventoryEventType,
    InventoryItem,
    InventoryStatus,
)
from app.repositories.inventory import (
    format_asset_tag,
    get_inventory_item,
    list_all_items,
    next_asset_tag_number,
)
from app.schemas.inventory import (
    InventoryAction,
    InventoryActionPayload,
    InventoryAttentionItemOut,
    InventoryCategoryShelfOut,
    InventoryItemCreate,
    InventoryItemUpdate,
    InventoryOverviewOut,
    InventoryReceive,
)
from app.services.activity import log_activity

ACTION_TRANSITIONS: dict[InventoryAction, tuple[set[InventoryStatus], InventoryStatus, InventoryEventType]] = {
    InventoryAction.PLACE: (
        {InventoryStatus.AVAILABLE},
        InventoryStatus.IN_USE,
        InventoryEventType.PLACED,
    ),
    InventoryAction.RETURN: (
        {InventoryStatus.IN_USE},
        InventoryStatus.AVAILABLE,
        InventoryEventType.RETURNED,
    ),
    InventoryAction.REPAIR: (
        {InventoryStatus.AVAILABLE, InventoryStatus.IN_USE},
        InventoryStatus.IN_REPAIR,
        InventoryEventType.SENT_TO_REPAIR,
    ),
    InventoryAction.REPAIRED: (
        {InventoryStatus.IN_REPAIR},
        InventoryStatus.AVAILABLE,
        InventoryEventType.REPAIRED,
    ),
    InventoryAction.RETIRE: (
        {InventoryStatus.AVAILABLE, InventoryStatus.IN_USE, InventoryStatus.IN_REPAIR},
        InventoryStatus.RETIRED,
        InventoryEventType.RETIRED,
    ),
}


def _add_event(
    item: InventoryItem,
    event_type: InventoryEventType,
    *,
    from_status: InventoryStatus | None,
    to_status: InventoryStatus | None,
    location: str | None = None,
    note: str | None = None,
    actor: User | None = None,
) -> InventoryEvent:
    event = InventoryEvent(
        event_type=event_type,
        from_status=from_status,
        to_status=to_status,
        location=location,
        note=note,
        performed_by_user_id=actor.id if actor else None,
    )
    item.events.append(event)
    return event


def create_inventory_item(
    db: Session, payload: InventoryItemCreate, actor: User | None = None
) -> InventoryItem:
    tag_number = next_asset_tag_number(db)
    item = InventoryItem(
        asset_tag=format_asset_tag(tag_number),
        **payload.model_dump(),
    )
    db.add(item)
    db.flush()
    _add_event(
        item,
        InventoryEventType.RECEIVED,
        from_status=None,
        to_status=item.status,
        location=item.location,
        note="Added to stockroom",
        actor=actor,
    )
    log_activity(
        db,
        "InventoryItem",
        item.id,
        "CREATE",
        f"Received {item.name} ({item.asset_tag})",
        performed_by_user_id=actor.id if actor else None,
    )
    db.commit()
    return get_inventory_item(db, item.id)  # type: ignore[return-value]


def receive_inventory_items(
    db: Session, payload: InventoryReceive, actor: User | None = None
) -> list[InventoryItem]:
    start = next_asset_tag_number(db)
    values = payload.model_dump(exclude={"quantity", "serial_number"})
    created: list[InventoryItem] = []
    for offset in range(payload.quantity):
        item = InventoryItem(
            asset_tag=format_asset_tag(start + offset),
            status=InventoryStatus.AVAILABLE,
            serial_number=payload.serial_number if payload.quantity == 1 else None,
            **values,
        )
        db.add(item)
        db.flush()
        _add_event(
            item,
            InventoryEventType.RECEIVED,
            from_status=None,
            to_status=InventoryStatus.AVAILABLE,
            location=item.location,
            note=f"Received stock ({payload.quantity} unit{'s' if payload.quantity != 1 else ''})",
            actor=actor,
        )
        created.append(item)
    first_tag = created[0].asset_tag
    last_tag = created[-1].asset_tag
    tag_range = first_tag if first_tag == last_tag else f"{first_tag}…{last_tag}"
    log_activity(
        db,
        "InventoryItem",
        created[0].id,
        "CREATE",
        f"Received {payload.quantity}× {payload.name} ({tag_range})",
        performed_by_user_id=actor.id if actor else None,
        metadata={"quantity": payload.quantity, "asset_tags": [row.asset_tag for row in created]},
    )
    db.commit()
    return [get_inventory_item(db, row.id) for row in created]  # type: ignore[misc]


def update_inventory_item(
    db: Session,
    item: InventoryItem,
    payload: InventoryItemUpdate,
    actor: User | None = None,
) -> InventoryItem:
    for key, value in payload.model_dump().items():
        setattr(item, key, value)
    _add_event(
        item,
        InventoryEventType.UPDATED,
        from_status=item.status,
        to_status=item.status,
        location=item.location,
        note="Item details updated",
        actor=actor,
    )
    log_activity(
        db,
        "InventoryItem",
        item.id,
        "UPDATE",
        f"Updated {item.name} ({item.asset_tag})",
        performed_by_user_id=actor.id if actor else None,
    )
    db.commit()
    return get_inventory_item(db, item.id)  # type: ignore[return-value]


def apply_inventory_action(
    db: Session,
    item: InventoryItem,
    payload: InventoryActionPayload,
    actor: User | None = None,
) -> InventoryItem:
    if item.status == InventoryStatus.RETIRED:
        raise HTTPException(status_code=422, detail="Retired items cannot change status.")
    allowed_from, to_status, event_type = ACTION_TRANSITIONS[payload.action]
    if item.status not in allowed_from:
        raise HTTPException(
            status_code=422,
            detail=f"Cannot {payload.action.value.lower()} an item that is {item.status.value}.",
        )
    from_status = item.status
    item.status = to_status
    location = payload.location.strip() if payload.location else None
    if payload.action == InventoryAction.PLACE:
        item.location = location
    elif payload.action == InventoryAction.RETURN:
        item.location = location or "Stockroom"
    elif location:
        item.location = location
    _add_event(
        item,
        event_type,
        from_status=from_status,
        to_status=to_status,
        location=item.location,
        note=payload.note,
        actor=actor,
    )
    log_activity(
        db,
        "InventoryItem",
        item.id,
        "UPDATE",
        f"{payload.action.value.title().replace('_', ' ')} {item.name} ({item.asset_tag})",
        performed_by_user_id=actor.id if actor else None,
    )
    db.commit()
    return get_inventory_item(db, item.id)  # type: ignore[return-value]


def delete_inventory_item(
    db: Session, item: InventoryItem, actor: User | None = None
) -> None:
    log_activity(
        db,
        "InventoryItem",
        item.id,
        "DELETE",
        f"Deleted {item.name} ({item.asset_tag})",
        performed_by_user_id=actor.id if actor else None,
    )
    db.delete(item)
    db.commit()


def build_inventory_overview(db: Session) -> InventoryOverviewOut:
    items = list_all_items(db)
    counts = {
        InventoryStatus.AVAILABLE: 0,
        InventoryStatus.IN_USE: 0,
        InventoryStatus.IN_REPAIR: 0,
        InventoryStatus.RETIRED: 0,
    }
    shelf: dict[InventoryCategory, dict[str, int]] = {
        category: {
            "total": 0,
            "available": 0,
            "in_use": 0,
            "in_repair": 0,
            "retired": 0,
        }
        for category in InventoryCategory
    }
    for item in items:
        counts[item.status] += 1
        bucket = shelf[item.category]
        bucket["total"] += 1
        if item.status == InventoryStatus.AVAILABLE:
            bucket["available"] += 1
        elif item.status == InventoryStatus.IN_USE:
            bucket["in_use"] += 1
        elif item.status == InventoryStatus.IN_REPAIR:
            bucket["in_repair"] += 1
        elif item.status == InventoryStatus.RETIRED:
            bucket["retired"] += 1

    today = date.today()
    warranty_cutoff = today + timedelta(days=30)
    attention: list[InventoryAttentionItemOut] = []
    seen: set[int] = set()

    def add_attention(item: InventoryItem, reason: str) -> None:
        if item.id in seen:
            return
        seen.add(item.id)
        attention.append(
            InventoryAttentionItemOut(
                id=item.id,
                asset_tag=item.asset_tag,
                name=item.name,
                category=item.category,
                status=item.status,
                reason=reason,
                warranty_until=item.warranty_until,
                location=item.location,
            )
        )

    for item in items:
        if item.status == InventoryStatus.IN_REPAIR:
            add_attention(item, "In repair")
    for item in items:
        if (
            item.warranty_until
            and today <= item.warranty_until <= warranty_cutoff
            and item.status != InventoryStatus.RETIRED
        ):
            add_attention(item, "Warranty ending soon")
    for item in items:
        if item.status == InventoryStatus.AVAILABLE and not (item.location and item.location.strip()):
            add_attention(item, "No location labeled")

    categories = [
        InventoryCategoryShelfOut(
            category=category,
            total=bucket["total"],
            available=bucket["available"],
            in_use=bucket["in_use"],
            in_repair=bucket["in_repair"],
            retired=bucket["retired"],
        )
        for category, bucket in shelf.items()
        if bucket["total"] > 0
    ]
    categories.sort(key=lambda row: (-row.total, row.category.value))

    return InventoryOverviewOut(
        available=counts[InventoryStatus.AVAILABLE],
        in_use=counts[InventoryStatus.IN_USE],
        in_repair=counts[InventoryStatus.IN_REPAIR],
        retired=counts[InventoryStatus.RETIRED],
        total=len(items),
        categories=categories,
        attention=attention[:25],
    )
