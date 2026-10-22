import { useEffect, useState } from "react";
import { Loading } from "../components/atoms";
import { EmptyState, FilterSelect } from "../components/molecules";
import { FilterToolbar, LeadsTable, PageHeader } from "../components/organisms";
import { useSearchParamState } from "../hooks/useSearchParamState";
import { listLeads, updateLeadStatus } from "../lib/api/leads";
import { label } from "../lib/format";
import { LEAD_STATUSES } from "../lib/options";
import { useToast } from "../toast";
import type { Lead, LeadStatus } from "../types";

export function LeadsPage() {
  const toast = useToast();
  const [status, setStatus] = useSearchParamState("status");

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    function load() {
      setLoading(true);
      setError("");
      listLeads((status as LeadStatus) || undefined)
        .then(setLeads)
        .catch((reason: Error) => setError(reason.message))
        .finally(() => setLoading(false));
    }
    load();
  }, [status]);

  async function handleStatusChange(lead: Lead, nextStatus: LeadStatus) {
    const previous = leads;
    setLeads((current) =>
      current.map((row) => (row.id === lead.id ? { ...row, status: nextStatus } : row)),
    );
    try {
      await updateLeadStatus(lead.id, nextStatus);
    } catch (reason) {
      setLeads(previous);
      toast.error(reason instanceof Error ? reason.message : "Could not update lead status.");
    }
  }

  const newCount = leads.filter((lead) => lead.status === "NEW").length;

  return (
    <div className="mx-auto max-w-[1450px] px-6 py-7">
      <PageHeader
        className="mb-8 px-1"
        title="Leads"
        description="Inquiries submitted through the public site's contact form."
        meta={
          newCount > 0 ? (
            <span className="rounded-full bg-tertiary/10 px-3 py-1 text-xs font-medium text-tertiary">
              {newCount} new
            </span>
          ) : undefined
        }
      />

      <section className="surface-panel overflow-hidden">
        <div className="bg-surface-container-high/30 px-6 py-4">
          <FilterToolbar>
            <FilterSelect
              value={status}
              onChange={setStatus}
              labelText="Status"
              placeholder="Filter by status"
            >
              {LEAD_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {label(value)}
                </option>
              ))}
            </FilterSelect>
          </FilterToolbar>
        </div>

        {loading ? (
          <div className="grid min-h-40 place-items-center">
            <Loading />
          </div>
        ) : error ? (
          <div className="px-6 py-8 text-sm text-error">{error}</div>
        ) : !leads.length ? (
          <EmptyState>
            {status ? "No leads match this filter." : "No leads have come in yet."}
          </EmptyState>
        ) : (
          <LeadsTable leads={leads} onStatusChange={handleStatusChange} />
        )}

        {!loading && !error && leads.length > 0 && (
          <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-outline-variant/30 bg-surface-container-highest/20 px-6 py-3.5 text-sm text-on-surface-variant">
            <span>
              Showing {leads.length} lead{leads.length === 1 ? "" : "s"}
            </span>
          </footer>
        )}
      </section>
    </div>
  );
}
