import type { ActivityFilters, ActivityListResult } from "../../types";
import { api } from "./client";

export function listActivity(filters: ActivityFilters = {}) {
  const params = new URLSearchParams();
  if (filters.entityType) params.set("entity_type", filters.entityType);
  if (filters.action) params.set("action", filters.action);
  if (filters.userId) params.set("user_id", String(filters.userId));
  if (filters.dateFrom) params.set("date_from", filters.dateFrom);
  if (filters.dateTo) params.set("date_to", filters.dateTo);
  params.set("page", String(filters.page ?? 1));
  params.set("page_size", String(filters.pageSize ?? 25));

  return api<ActivityListResult>(`/admin/activity?${params.toString()}`);
}
