import type { Organization, OrganizationPayload } from "../../types";
import { api } from "./client";

export function getOrganization() {
  return api<Organization>("/organization");
}

export function updateOrganization(payload: OrganizationPayload) {
  return api<Organization>("/organization", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
