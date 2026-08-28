from datetime import date, datetime
from enum import Enum

from pydantic import Field, model_validator

from app.models.inventory import (
    InventoryCategory,
    InventoryCondition,
    InventoryEventType,
    InventoryStatus,
)
from app.schemas.common import ApiModel


class InventoryAction(str, Enum):
    PLACE = "PLACE"
    RETURN = "RETURN"
    REPAIR = "REPAIR"
    REPAIRED = "REPAIRED"
    RETIRE = "RETIRE"


class InventoryItemBase(ApiModel):
    name: str = Field(min_length=1, max_length=160)
    category: InventoryCategory
    condition: InventoryCondition = InventoryCondition.GOOD
    serial_number: str | None = Field(default=None, max_length=120)
    location: str | None = Field(default=None, max_length=160)
    notes: str | None = None
    purchased_on: date | None = None
    warranty_until: date | None = None

    @model_validator(mode="after")
    def validate_dates(self) -> "InventoryItemBase":
        if (
            self.purchased_on
            and self.warranty_until
            and self.warranty_until < self.purchased_on
        ):
            raise ValueError("Warranty end date cannot be before the purchase date.")
        return self


class InventoryItemCreate(InventoryItemBase):
    status: InventoryStatus = InventoryStatus.AVAILABLE


class InventoryItemUpdate(InventoryItemBase):
    pass


class InventoryReceive(ApiModel):
    name: str = Field(min_length=1, max_length=160)
    category: InventoryCategory
    condition: InventoryCondition = InventoryCondition.GOOD
    quantity: int = Field(default=1, ge=1, le=50)
    location: str | None = Field(default=None, max_length=160)
    serial_number: str | None = Field(default=None, max_length=120)
    notes: str | None = None
    purchased_on: date | None = None
    warranty_until: date | None = None

    @model_validator(mode="after")
    def validate_receive(self) -> "InventoryReceive":
        if (
            self.purchased_on
            and self.warranty_until
            and self.warranty_until < self.purchased_on
        ):
            raise ValueError("Warranty end date cannot be before the purchase date.")
        if self.quantity > 1 and self.serial_number:
            raise ValueError("Serial number can only be set when receiving a single unit.")
        return self


class InventoryActionPayload(ApiModel):
    action: InventoryAction
    location: str | None = Field(default=None, max_length=160)
    note: str | None = None

    @model_validator(mode="after")
    def validate_action(self) -> "InventoryActionPayload":
        if self.action == InventoryAction.PLACE and not (self.location and self.location.strip()):
            raise ValueError("Location is required when placing an item.")
        return self


class InventoryEventOut(ApiModel):
    id: int
    event_type: InventoryEventType
    from_status: InventoryStatus | None = None
    to_status: InventoryStatus | None = None
    location: str | None = None
    note: str | None = None
    performed_by_user_id: int | None = None
    created_at: datetime


class InventoryItemOut(InventoryItemBase):
    id: int
    asset_tag: str
    status: InventoryStatus
    events: list[InventoryEventOut] = Field(default_factory=list)


class InventoryCategoryShelfOut(ApiModel):
    category: InventoryCategory
    total: int
    available: int
    in_use: int
    in_repair: int
    retired: int


class InventoryAttentionItemOut(ApiModel):
    id: int
    asset_tag: str
    name: str
    category: InventoryCategory
    status: InventoryStatus
    reason: str
    warranty_until: date | None = None
    location: str | None = None


class InventoryOverviewOut(ApiModel):
    available: int
    in_use: int
    in_repair: int
    retired: int
    total: int
    categories: list[InventoryCategoryShelfOut]
    attention: list[InventoryAttentionItemOut]
