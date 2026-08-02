import type { Organization, OrganizationPayload } from "../../types";
import { api } from "./client";

export function getOrganization() {
  return api<Organization>("/public/organization");
}

export function updateOrganization(payload: OrganizationPayload) {
  return api<Organization>("/admin/organization", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
