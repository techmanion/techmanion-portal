import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Icon, Loading } from "../components/atoms";
import { ConfirmDialog, EmptyState, FilterSelect, SearchInput } from "../components/molecules";
import { FilterToolbar, PageHeader, PayrollSummary, PayrollTable } from "../components/organisms";
import { useSearchParamState } from "../hooks/useSearchParamState";
import {
  deletePayrollEntry,
  generatePayroll,
  listPayrollEntries,
  markPayrollPaid,
} from "../lib/api/payroll";
import { useToast } from "../toast";
import type { PayrollEntry } from "../types";

export function PayrollPage() {
  const navigate = useNavigate();
  const [month, setMonth] = useSearchParamState("month", new Date().toISOString().slice(0, 7));
  const [entries, setEntries] = useState<PayrollEntry[]>([]);
  const [search, setSearch] = useSearchParamState("search");
  const [status, setStatus] = useSearchParamState("status");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirmGenerate, setConfirmGenerate] = useState(false);
  const [confirmDeleteEntry, setConfirmDeleteEntry] = useState<PayrollEntry | null>(null);
  const toast = useToast();

  function load() {
    listPayrollEntries(month)
      .then(setEntries)
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [month]);

  const visible = useMemo(
    () =>
      entries.filter(
        (entry) =>
          (!search || entry.employeeName.toLowerCase().includes(search.toLowerCase())) &&
          (!status || entry.status === status),
      ),
    [entries, search, status],
  );

  const hasActiveFilters = Boolean(search || status);
  function clearFilters() {
    setSearch("");
    setStatus("");
  }

  const totals = useMemo(
    () => ({
      base: entries.reduce((sum, row) => sum + row.baseCompensation, 0),
      adjustment: entries.reduce((sum, row) => sum + row.adjustment, 0),
      final: entries.reduce((sum, row) => sum + row.finalAmount, 0),
      paidCount: entries.filter((row) => row.status === "PAID").length,
      pendingCount: entries.filter((row) => row.status === "PENDING").length,
    }),
    [entries],
  );
  const currency = entries[0]?.currency ?? "PKR";
  const paidPct = entries.length ? (totals.paidCount / entries.length) * 100 : 0;
  const monthLabel = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(
    new Date(`${month}-01T00:00:00`),
  );

  async function generate() {
    setConfirmGenerate(false);
    setError("");
    try {
      const generated = await generatePayroll(month);
      load();
      toast.success(`Payroll generated for ${generated.length} employee${generated.length === 1 ? "" : "s"}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Payroll could not be generated.");
    }
  }

  async function markPaid(entry: PayrollEntry) {
    try {
      await markPayrollPaid(entry.id);
      load();
      toast.success(`Marked ${entry.employeeName} as paid.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Payroll entry could not be marked paid.");
    }
  }

  async function deleteEntry() {
    if (!confirmDeleteEntry) return;
    const entry = confirmDeleteEntry;
    setConfirmDeleteEntry(null);
    try {
      await deletePayrollEntry(entry.id);
      load();
      toast.success("Payroll entry deleted.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Payroll entry could not be deleted.");
    }
  }

  return (
    <div className="mx-auto max-w-[1540px] px-6 py-7">
      <PageHeader
        className="mb-8 px-1"
        title="Payroll"
        description="Manage monthly payroll entries and employee payments"
        actions={
          <>
            <label className="relative flex h-10 items-center rounded-full bg-surface-container-high px-4">
              <Icon className="mr-2.5 text-[18px]">calendar_month</Icon>
              <input
                aria-label="Payroll month"
                type="month"
                value={month}
                onChange={(event) => {
                  setLoading(true);
                  setMonth(event.target.value);
                }}
                className="w-32 bg-transparent text-sm font-medium text-on-surface outline-none"
              />
              <span className="pointer-events-none absolute inset-y-0 left-11 flex items-center bg-surface-container-high pr-3 text-sm font-medium">
                {monthLabel}
              </span>
            </label>
            <Button size="lg" onClick={() => setConfirmGenerate(true)}>
              <Icon className="text-[18px]">add</Icon>
              Generate Payroll
            </Button>
            <Link
              to={`/payroll/new?month=${month}`}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-surface-container-highest px-5 text-sm font-medium text-on-surface ring-1 ring-outline-variant/40 hover:bg-surface-bright"
            >
              <Icon className="text-[18px]">add</Icon>
              Add entry
            </Link>
          </>
        }
      />

      <section className="surface-panel mb-6 p-6">
        <PayrollSummary
          totalCount={entries.length}
          base={totals.base}
          adjustment={totals.adjustment}
          final={totals.final}
          currency={currency}
          paidCount={totals.paidCount}
          pendingCount={totals.pendingCount}
          paidPct={paidPct}
        />
      </section>

      <section className="surface-panel overflow-hidden">
        <div className="bg-surface-container-high/30 px-6 py-4">
          <FilterToolbar>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search employees..."
              className="lg:max-w-[380px]"
            />
            <FilterSelect value={status} onChange={setStatus} labelText="Status">
              <option value="">Status: All</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
            </FilterSelect>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <Icon className="text-[16px]">filter_alt_off</Icon>
                Clear filters
              </Button>
            )}
          </FilterToolbar>
        </div>

        {loading && (
          <div className="grid min-h-40 place-items-center">
            <Loading />
          </div>
        )}
        {!loading && (
          <PayrollTable
            entries={visible}
            onMarkPaid={markPaid}
            onEdit={(entry) => navigate(`/payroll/${entry.id}/edit?month=${month}`)}
            onDelete={setConfirmDeleteEntry}
          />
        )}
        {!loading && !entries.length && (
          <EmptyState>No payroll entries for this month. Generate payroll or add an entry.</EmptyState>
        )}
        {!loading && entries.length > 0 && !visible.length && (
          <EmptyState>No entries match these filters.</EmptyState>
        )}

        {!loading && (
          <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-outline-variant/30 bg-surface-container-highest/20 px-7 py-4 text-sm text-on-surface-variant">
            <span>Showing {visible.length} of {entries.length} employees</span>
          </footer>
        )}
      </section>
      {error && <div className="mt-4 rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div>}

      <ConfirmDialog
        open={confirmGenerate}
        title={`Generate payroll for ${monthLabel}?`}
        description="This creates a pending payroll entry for every active employee who doesn't already have one this month."
        confirmLabel="Generate"
        tone="primary"
        onConfirm={generate}
        onCancel={() => setConfirmGenerate(false)}
      />
      <ConfirmDialog
        open={confirmDeleteEntry !== null}
        title="Delete this payroll entry?"
        description={
          confirmDeleteEntry
            ? `The entry for ${confirmDeleteEntry.employeeName} will be permanently removed.`
            : undefined
        }
        confirmLabel="Delete entry"
        onConfirm={deleteEntry}
        onCancel={() => setConfirmDeleteEntry(null)}
      />
    </div>
  );
}
