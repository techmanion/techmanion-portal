import type { Lead, LeadStatus } from "../../types";
import { api } from "./client";

export function listLeads(status?: LeadStatus) {
  return api<Lead[]>(`/admin/leads${status ? `?status=${status}` : ""}`);
}

export function updateLeadStatus(leadId: number, status: LeadStatus) {
  return api<Lead>(`/admin/leads/${leadId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
