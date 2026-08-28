import type {
  InventoryActionPayload,
  InventoryItem,
  InventoryItemPayload,
  InventoryOverview,
  InventoryReceivePayload,
} from "../../types";
import { api } from "./client";

export function getInventoryOverview() {
  return api<InventoryOverview>("/admin/inventory/overview");
}

export function listInventoryItems(params?: {
  search?: string;
  category?: string;
  status?: string;
  condition?: string;
}) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.category) query.set("category", params.category);
  if (params?.status) query.set("status", params.status);
  if (params?.condition) query.set("condition", params.condition);
  const suffix = query.toString() ? `?${query}` : "";
  return api<InventoryItem[]>(`/admin/inventory/items${suffix}`);
}

export function getInventoryItem(itemId: string | number) {
  return api<InventoryItem>(`/admin/inventory/items/${itemId}`);
}

export function createInventoryItem(payload: InventoryItemPayload) {
  return api<InventoryItem>("/admin/inventory/items", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function receiveInventoryItems(payload: InventoryReceivePayload) {
  return api<InventoryItem[]>("/admin/inventory/items/receive", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateInventoryItem(itemId: string | number, payload: InventoryItemPayload) {
  return api<InventoryItem>(`/admin/inventory/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function applyInventoryAction(itemId: string | number, payload: InventoryActionPayload) {
  return api<InventoryItem>(`/admin/inventory/items/${itemId}/actions`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteInventoryItem(itemId: string | number) {
  return api<void>(`/admin/inventory/items/${itemId}`, { method: "DELETE" });
}
