from fastapi import APIRouter, HTTPException, Query, status

from app.api.dependencies import CurrentUser, DbSession
from app.core.errors import get_or_404
from app.models.inventory import (
    InventoryCategory,
    InventoryCondition,
    InventoryItem,
    InventoryStatus,
)
from app.repositories.inventory import get_inventory_item, list_inventory_items
from app.schemas.inventory import (
    InventoryActionPayload,
    InventoryEventOut,
    InventoryItemCreate,
    InventoryItemOut,
    InventoryItemUpdate,
    InventoryOverviewOut,
    InventoryReceive,
)
from app.services.inventory import (
    apply_inventory_action,
    build_inventory_overview,
    create_inventory_item,
    delete_inventory_item,
    receive_inventory_items,
    update_inventory_item,
)

router = APIRouter(prefix="/inventory", tags=["inventory"])


def serialize_item(item: InventoryItem, *, include_events: bool = False) -> InventoryItemOut:
    return InventoryItemOut(
        id=item.id,
        asset_tag=item.asset_tag,
        name=item.name,
        category=item.category,
        status=item.status,
        condition=item.condition,
        serial_number=item.serial_number,
        location=item.location,
        notes=item.notes,
        purchased_on=item.purchased_on,
        warranty_until=item.warranty_until,
        events=[
            InventoryEventOut(
                id=event.id,
                event_type=event.event_type,
                from_status=event.from_status,
                to_status=event.to_status,
                location=event.location,
                note=event.note,
                performed_by_user_id=event.performed_by_user_id,
                created_at=event.created_at,
            )
            for event in (item.events if include_events else [])
        ],
    )


@router.get("/overview", response_model=InventoryOverviewOut)
def inventory_overview(db: DbSession, _: CurrentUser) -> InventoryOverviewOut:
    return build_inventory_overview(db)


@router.get("/items", response_model=list[InventoryItemOut])
def list_items(
    db: DbSession,
    _: CurrentUser,
    search: str | None = Query(default=None),
    category: InventoryCategory | None = Query(default=None),
    status_filter: InventoryStatus | None = Query(default=None, alias="status"),
    condition: InventoryCondition | None = Query(default=None),
) -> list[InventoryItemOut]:
    items = list_inventory_items(
        db,
        search=search,
        category=category,
        status=status_filter,
        condition=condition,
    )
    return [serialize_item(item) for item in items]


@router.post("/items", response_model=InventoryItemOut, status_code=status.HTTP_201_CREATED)
def create_item(
    payload: InventoryItemCreate, db: DbSession, user: CurrentUser
) -> InventoryItemOut:
    item = create_inventory_item(db, payload, user)
    return serialize_item(item, include_events=True)


@router.post(
    "/items/receive",
    response_model=list[InventoryItemOut],
    status_code=status.HTTP_201_CREATED,
)
def receive_items(
    payload: InventoryReceive, db: DbSession, user: CurrentUser
) -> list[InventoryItemOut]:
    items = receive_inventory_items(db, payload, user)
    return [serialize_item(item, include_events=True) for item in items]


@router.get("/items/{item_id}", response_model=InventoryItemOut)
def get_item(item_id: int, db: DbSession, _: CurrentUser) -> InventoryItemOut:
    item = get_inventory_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item was not found.")
    return serialize_item(item, include_events=True)


@router.patch("/items/{item_id}", response_model=InventoryItemOut)
def patch_item(
    item_id: int, payload: InventoryItemUpdate, db: DbSession, user: CurrentUser
) -> InventoryItemOut:
    item = get_or_404(db, InventoryItem, item_id, "Inventory item was not found.")
    updated = update_inventory_item(db, item, payload, user)
    return serialize_item(updated, include_events=True)


@router.post("/items/{item_id}/actions", response_model=InventoryItemOut)
def item_action(
    item_id: int, payload: InventoryActionPayload, db: DbSession, user: CurrentUser
) -> InventoryItemOut:
    item = get_or_404(db, InventoryItem, item_id, "Inventory item was not found.")
    updated = apply_inventory_action(db, item, payload, user)
    return serialize_item(updated, include_events=True)


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_item(item_id: int, db: DbSession, user: CurrentUser) -> None:
    item = get_or_404(db, InventoryItem, item_id, "Inventory item was not found.")
    delete_inventory_item(db, item, user)
