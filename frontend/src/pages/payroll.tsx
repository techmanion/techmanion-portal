import { useEffect, useMemo, useState } from "react";
import { Button, Icon, IconButton, StatusChip } from "../components/atoms";
import { EmployeeCell, EmptyState, FilterSelect, PaginationControls, SearchInput } from "../components/molecules";
import { DataTable, FilterToolbar, PageHeader, PayrollSummary, TableHeadRow, TableRow } from "../components/organisms";
import { api } from "../lib/api";
import { formatMoney } from "../lib/format";
import type { Employee, NamedOption, PayrollRun } from "../types";

export function PayrollPage() {
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [department, setDepartment] = useState("");
  const [departments, setDepartments] = useState<NamedOption[]>([]);
  const [employeeDepartments, setEmployeeDepartments] = useState<Record<number, number>>({});
  const [error, setError] = useState("");

  function load() {
    api<PayrollRun[]>("/payroll")
      .then((rows) => {
        setRuns(rows);
        setSelectedId((current) => current ?? rows[0]?.id ?? null);
      })
      .catch((reason: Error) => setError(reason.message));
  }

  useEffect(load, []);
  useEffect(() => {
    Promise.all([api<NamedOption[]>("/settings/departments"), api<Employee[]>("/employees")])
      .then(([departmentRows, employeeRows]) => {
        setDepartments(departmentRows);
        setEmployeeDepartments(
          Object.fromEntries(
            employeeRows.filter((employee) => employee.departmentId).map((employee) => [employee.id, employee.departmentId as number]),
          ),
        );
      })
      .catch(() => undefined);
  }, []);
  const selected = useMemo(() => runs.find((run) => run.id === selectedId), [runs, selectedId]);
  const visible = useMemo(
    () =>
      (selected?.payslips ?? []).filter(
        (payslip) =>
          (!search || payslip.employeeName.toLowerCase().includes(search.toLowerCase())) &&
          (!status || payslip.paymentStatus === status) &&
          (!department || employeeDepartments[payslip.employeeId] === Number(department)),
      ),
    [selected, search, status, department, employeeDepartments],
  );

  const hasActiveFilters = Boolean(search || status || department);
  function clearFilters() {
    setSearch("");
    setStatus("");
    setDepartment("");
  }
  const totals = useMemo(() => {
    const rows = selected?.payslips ?? [];
    return {
      gross: rows.reduce((sum, row) => sum + row.grossAmount, 0),
      tax: rows.reduce((sum, row) => sum + row.taxAmount, 0),
      net: rows.reduce((sum, row) => sum + row.netAmount, 0),
      paid: rows.reduce((sum, row) => sum + row.paidAmount, 0),
      paidCount: rows.filter((row) => row.paymentStatus === "PAID").length,
      partialCount: rows.filter((row) => row.paymentStatus === "PARTIALLY_PAID").length,
      pendingCount: rows.filter((row) => row.paymentStatus === "PENDING").length,
    };
  }, [selected]);

  async function createRun() {
    setError("");
    try {
      const run = await api<PayrollRun>(`/payroll/${month}`, { method: "POST" });
      setRuns((current) => [run, ...current]);
      setSelectedId(run.id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Payroll could not be generated.");
    }
  }

  async function markPaid(payslipId: number, netAmount: number) {
    await api(`/payslips/${payslipId}/payment`, {
      method: "PATCH",
      body: JSON.stringify({ paymentStatus: "PAID", paidAmount: netAmount }),
    });
    load();
  }

  const currency = selected?.payslips[0]?.currency ?? "PKR";
  const totalCount = selected?.payslips.length ?? 0;
  const paidPct = totalCount ? (totals.paidCount / totalCount) * 100 : 0;
  const partialPct = totalCount ? (totals.partialCount / totalCount) * 100 : 0;
  const monthLabel = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(
    new Date(`${month}-01T00:00:00`),
  );

  return (
    <div className="mx-auto max-w-[1540px] px-6 py-7">
      <PageHeader
        className="mb-8 px-1"
        title="Payroll"
        description="Manage monthly payroll, deductions and employee payments"
        actions={
          <>
            <label className="relative flex h-10 items-center rounded-full bg-surface-container-high px-4">
              <Icon className="mr-2.5 text-[18px]">calendar_month</Icon>
              <input
                aria-label="Payroll month"
                type="month"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                className="w-32 bg-transparent text-sm font-medium text-on-surface outline-none [color-scheme:dark]"
              />
              <span className="pointer-events-none absolute inset-y-0 left-11 flex items-center bg-surface-container-high pr-3 text-sm font-medium">
                {monthLabel}
              </span>
            </label>
            <Button size="lg" onClick={createRun}>
              <Icon className="text-[18px]">add</Icon>
              Generate Payroll
            </Button>
          </>
        }
      />

      {runs.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2 px-1">
          {runs.map((run) => (
            <button
              key={run.id}
              onClick={() => {
                setSelectedId(run.id);
                setMonth(run.periodMonth);
              }}
              className={`rounded-full px-3 py-1.5 text-xs ${run.id === selectedId ? "bg-primary/20 text-primary" : "bg-surface-container-high text-on-surface-variant"}`}
            >
              {run.periodMonth}
            </button>
          ))}
        </div>
      )}

      <section className="surface-panel mb-6 p-6">
        <PayrollSummary
          totalCount={totalCount}
          gross={totals.gross}
          tax={totals.tax}
          net={totals.net}
          outstanding={Math.max(0, totals.net - totals.paid)}
          currency={currency}
          paidCount={totals.paidCount}
          partialCount={totals.partialCount}
          pendingCount={totals.pendingCount}
          paidPct={paidPct}
          partialPct={partialPct}
        />
      </section>

      <section className="surface-panel overflow-hidden">
        <div className="bg-surface-container-high/30 px-6 py-4">
          <FilterToolbar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search employees..." className="lg:max-w-[380px]" />
            <FilterSelect value={department} onChange={setDepartment} labelText="Department">
              <option value="">Department: All</option>
              {departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </FilterSelect>
            <FilterSelect value={status} onChange={setStatus} labelText="Status">
              <option value="">Status: All</option>
              <option value="PAID">Paid</option>
              <option value="PARTIALLY_PAID">Partial</option>
              <option value="PENDING">Pending</option>
            </FilterSelect>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <Icon className="text-[16px]">filter_alt_off</Icon>
                Clear filters
              </Button>
            )}
            <div className="ml-auto flex items-center gap-1">
              <IconButton aria-label="Download"><Icon>download</Icon></IconButton>
              <IconButton aria-label="Print" onClick={() => window.print()}><Icon>print</Icon></IconButton>
            </div>
          </FilterToolbar>
        </div>

        <DataTable minWidth="1180px">
          <thead>
            <TableHeadRow>
              <th className="px-7 py-3 font-medium">Employee</th>
              <th className="px-4 py-3 text-right font-medium">Gross Salary</th>
              <th className="px-4 py-3 text-right font-medium">Tax</th>
              <th className="px-4 py-3 text-right font-medium">Deductions</th>
              <th className="px-4 py-3 text-right font-medium">Net Payable</th>
              <th className="px-4 py-3 text-right font-medium">Paid</th>
              <th className="px-4 py-3 text-right font-medium">Remaining</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </TableHeadRow>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {visible.map((payslip) => (
              <TableRow key={payslip.id}>
                <td className="px-7">
                  <EmployeeCell name={payslip.employeeName} subtitle={`Employee #${payslip.employeeId}`} />
                </td>
                <td className="px-4 text-right text-sm">{formatMoney(payslip.grossAmount, payslip.currency)}</td>
                <td className="px-4 text-right text-sm text-error">{formatMoney(payslip.taxAmount, payslip.currency)}</td>
                <td className="px-4 text-right text-sm">—</td>
                <td className="px-4 text-right text-sm font-semibold">{formatMoney(payslip.netAmount, payslip.currency)}</td>
                <td className="px-4 text-right text-sm text-primary">{formatMoney(payslip.paidAmount, payslip.currency)}</td>
                <td className={`px-4 text-right text-sm ${payslip.netAmount - payslip.paidAmount ? "text-tertiary" : "text-on-surface"}`}>{formatMoney(Math.max(0, payslip.netAmount - payslip.paidAmount), payslip.currency)}</td>
                <td className="px-4"><StatusChip value={payslip.paymentStatus} /></td>
                <td className="px-4">
                  {payslip.paymentStatus !== "PAID" ? (
                    <button className="rounded-full px-2.5 py-1.5 text-xs text-primary hover:bg-primary/10" onClick={() => markPaid(payslip.id, payslip.netAmount)}>Mark paid</button>
                  ) : (
                    <IconButton size="sm" aria-label="More actions"><Icon className="text-[18px]">more_vert</Icon></IconButton>
                  )}
                </td>
              </TableRow>
            ))}
          </tbody>
        </DataTable>
        {!selected && <EmptyState>Select a month and generate payroll.</EmptyState>}
        {selected && !visible.length && <EmptyState>No employees match these filters.</EmptyState>}

        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-outline-variant/30 bg-surface-container-highest/20 px-7 py-4 text-sm text-on-surface-variant">
          <span>Showing {visible.length} of {totalCount} employees</span>
          <PaginationControls page={1} pageCount={3} showEdges={false} />
        </footer>
      </section>
      {error && <div className="mt-4 rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div>}
    </div>
  );
}
