import type { InventoryAction, InventoryItem, InventoryStatus } from "../../types";

export function availableInventoryActions(status: InventoryStatus): InventoryAction[] {
  switch (status) {
    case "AVAILABLE":
      return ["PLACE", "REPAIR", "RETIRE"];
    case "IN_USE":
      return ["RETURN", "REPAIR", "RETIRE"];
    case "IN_REPAIR":
      return ["REPAIRED", "RETIRE"];
    default:
      return [];
  }
}

export function inventoryActionLabel(action: InventoryAction): string {
  switch (action) {
    case "PLACE":
      return "Place";
    case "RETURN":
      return "Return";
    case "REPAIR":
      return "Send to repair";
    case "REPAIRED":
      return "Mark repaired";
    case "RETIRE":
      return "Retire";
  }
}

export function inventoryActionIcon(action: InventoryAction): string {
  switch (action) {
    case "PLACE":
      return "place_item";
    case "RETURN":
      return "keyboard_return";
    case "REPAIR":
      return "build";
    case "REPAIRED":
      return "check_circle";
    case "RETIRE":
      return "delete_forever";
  }
}

export function formatAssetRange(items: InventoryItem[]): string {
  if (!items.length) return "";
  const first = items[0].assetTag;
  const last = items[items.length - 1].assetTag;
  return first === last ? first : `${first}…${last}`;
}
