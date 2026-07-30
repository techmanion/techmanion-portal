import { useEffect, useMemo, useState } from "react";
import { Button, Icon, IconButton, Input, Loading, Select, StatusChip, Textarea } from "../components/atoms";
import { EmployeeCell, EmptyState, FilterSelect, FormField, SearchInput } from "../components/molecules";
import { DataTable, FilterToolbar, PageHeader, PayrollSummary, TableHeadRow, TableRow } from "../components/organisms";
import { api } from "../lib/api";
import { formatMoney } from "../lib/format";
import type { Employee, PayrollEntry } from "../types";

const emptyForm = {
  employeeId: "",
  baseCompensation: "",
  adjustment: "0",
  currency: "PKR",
  notes: "",
};

export function PayrollPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [entries, setEntries] = useState<PayrollEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  function load() {
    api<PayrollEntry[]>(`/payroll?month=${month}`)
      .then(setEntries)
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [month]);
  useEffect(() => {
    api<Employee[]>("/employees").then(setEmployees).catch(() => undefined);
  }, []);

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
    setError("");
    try {
      await api(`/payroll/generate?month=${month}`, { method: "POST" });
      load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Payroll could not be generated.");
    }
  }

  async function markPaid(entryId: number) {
    try {
      await api(`/payroll/${entryId}/pay`, { method: "PATCH", body: JSON.stringify({}) });
      load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Payroll entry could not be marked paid.");
    }
  }

  async function deleteEntry(entryId: number) {
    if (!window.confirm("Delete this payroll entry?")) return;
    try {
      await api(`/payroll/${entryId}`, { method: "DELETE" });
      load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Payroll entry could not be deleted.");
    }
  }

  function startEdit(entry: PayrollEntry) {
    setEditingId(entry.id);
    setForm({
      employeeId: String(entry.employeeId),
      baseCompensation: String(entry.baseCompensation / 100),
      adjustment: String(entry.adjustment / 100),
      currency: entry.currency,
      notes: entry.notes ?? "",
    });
    setShowForm(true);
  }

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function submitEntry(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const payload = {
      employeeId: Number(form.employeeId),
      month,
      baseCompensation: Math.round(Number(form.baseCompensation || 0) * 100),
      adjustment: Math.round(Number(form.adjustment || 0) * 100),
      currency: form.currency,
      notes: form.notes || null,
    };
    try {
      if (editingId) {
        await api(`/payroll/${editingId}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await api("/payroll", { method: "POST", body: JSON.stringify(payload) });
      }
      resetForm();
      load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Payroll entry could not be saved.");
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
            <Button size="lg" onClick={generate}>
              <Icon className="text-[18px]">add</Icon>
              Generate Payroll
            </Button>
            <Button size="lg" variant="secondary" onClick={() => (showForm ? resetForm() : setShowForm(true))}>
              <Icon className="text-[18px]">add</Icon>
              Add entry
            </Button>
          </>
        }
      />

      {showForm && (
        <form className="surface-panel mb-6 grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3" onSubmit={submitEntry}>
          <FormField label="Employee">
            <Select
              value={form.employeeId}
              onChange={(event) => setForm({ ...form, employeeId: event.target.value })}
              disabled={Boolean(editingId)}
              required
            >
              <option value="">Select employee</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>{employee.fullName}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Base compensation"><Input type="number" min="0" value={form.baseCompensation} onChange={(event) => setForm({ ...form, baseCompensation: event.target.value })} required /></FormField>
          <FormField label="Adjustment" hint="Negative values are deductions"><Input type="number" value={form.adjustment} onChange={(event) => setForm({ ...form, adjustment: event.target.value })} /></FormField>
          <FormField label="Currency"><Input value={form.currency} maxLength={3} onChange={(event) => setForm({ ...form, currency: event.target.value.toUpperCase() })} required /></FormField>
          <FormField label="Notes" className="md:col-span-2 xl:col-span-3"><Textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></FormField>
          <div className="flex gap-2.5 md:col-span-2 xl:col-span-3">
            <Button type="submit">{editingId ? "Save changes" : "Add entry"}</Button>
            <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button>
          </div>
        </form>
      )}

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
            <SearchInput value={search} onChange={setSearch} placeholder="Search employees..." className="lg:max-w-[380px]" />
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

        {loading && <div className="grid min-h-40 place-items-center"><Loading /></div>}
        {!loading && <DataTable minWidth="1080px">
          <thead>
            <TableHeadRow>
              <th className="px-7 py-3 font-medium">Employee</th>
              <th className="px-4 py-3 text-right font-medium">Base Compensation</th>
              <th className="px-4 py-3 text-right font-medium">Adjustment</th>
              <th className="px-4 py-3 text-right font-medium">Final Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </TableHeadRow>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {visible.map((entry) => (
              <TableRow key={entry.id}>
                <td className="px-7">
                  <EmployeeCell name={entry.employeeName} subtitle={`Employee #${entry.employeeId}`} />
                </td>
                <td className="px-4 text-right text-sm">{formatMoney(entry.baseCompensation, entry.currency)}</td>
                <td className={`px-4 text-right text-sm ${entry.adjustment < 0 ? "text-error" : "text-on-surface"}`}>{formatMoney(entry.adjustment, entry.currency)}</td>
                <td className="px-4 text-right text-sm font-semibold">{formatMoney(entry.finalAmount, entry.currency)}</td>
                <td className="px-4"><StatusChip value={entry.status} /></td>
                <td className="px-4">
                  <div className="flex items-center gap-1">
                    {entry.status !== "PAID" && (
                      <button className="rounded-full px-2.5 py-1.5 text-xs text-primary hover:bg-primary/10" onClick={() => markPaid(entry.id)}>Mark paid</button>
                    )}
                    <IconButton size="sm" aria-label={`Edit ${entry.employeeName}`} onClick={() => startEdit(entry)}><Icon className="text-[18px]">edit</Icon></IconButton>
                    <IconButton size="sm" aria-label={`Delete ${entry.employeeName}`} onClick={() => deleteEntry(entry.id)}><Icon className="text-[18px]">delete</Icon></IconButton>
                  </div>
                </td>
              </TableRow>
            ))}
          </tbody>
        </DataTable>}
        {!loading && !entries.length && <EmptyState>No payroll entries for this month. Generate payroll or add an entry.</EmptyState>}
        {!loading && entries.length > 0 && !visible.length && <EmptyState>No entries match these filters.</EmptyState>}

        {!loading && <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-outline-variant/30 bg-surface-container-highest/20 px-7 py-4 text-sm text-on-surface-variant">
          <span>Showing {visible.length} of {entries.length} employees</span>
        </footer>}
      </section>
      {error && <div className="mt-4 rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div>}
    </div>
  );
}
