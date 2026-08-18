import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Icon, Loading, Select } from "../components/atoms";
import { ConfirmDialog, EmptyState, FilterSelect, FormDialog, FormField, MoneyInput, SearchInput } from "../components/molecules";
import {
  BankAccountsTable,
  ExpensesTable,
  FinanceIncomeTable,
  FinanceOverviewPanel,
  FilterToolbar,
  PageHeader,
  PayrollSummary,
  PayrollTable,
} from "../components/organisms";
import { useClearSearchParams, useSearchParamState } from "../hooks/useSearchParamState";
import {
  backfillPayrollBank,
  deleteExpense,
  deletePayrollEntry,
  generatePayroll,
  getFinanceOverview,
  listBankAccounts,
  listExpenses,
  listFinanceIncome,
  listPayrollEntries,
  markPayrollPaid,
} from "../lib/api/finance";
import { useToast } from "../toast";
import type { BankAccount, Expense, FinanceIncome, FinanceOverview, PayrollEntry } from "../types";

const tabs = ["Overview", "Payroll", "Income", "Expenses", "Bank Accounts"] as const;
type FinanceTab = (typeof tabs)[number];

function resolveTab(value: string): FinanceTab {
  return tabs.find((tab) => tab.toLowerCase() === value) ?? "Overview";
}

export function FinancePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [tabParam, setTabParam] = useSearchParamState("tab", "overview");
  const activeTab = resolveTab(tabParam);
  const [month, setMonth] = useSearchParamState("month", new Date().toISOString().slice(0, 7));
  const [search, setSearch] = useSearchParamState("search");
  const [status, setStatus] = useSearchParamState("status");
  const clearSearchParams = useClearSearchParams();
  const [overview, setOverview] = useState<FinanceOverview | null>(null);
  const [income, setIncome] = useState<FinanceIncome[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [entries, setEntries] = useState<PayrollEntry[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmExpense, setConfirmExpense] = useState<Expense | null>(null);
  const [confirmGenerate, setConfirmGenerate] = useState(false);
  const [confirmPayroll, setConfirmPayroll] = useState<PayrollEntry | null>(null);
  const [payTarget, setPayTarget] = useState<PayrollEntry | null>(null);
  const [payBankAccountId, setPayBankAccountId] = useState<number | "">("");
  const [payPkrEquivalent, setPayPkrEquivalent] = useState<number>(0);
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [payError, setPayError] = useState("");
  const [backfillTarget, setBackfillTarget] = useState<PayrollEntry | null>(null);
  const [backfillBankAccountId, setBackfillBankAccountId] = useState<number | "">("");
  const [backfillPkrEquivalent, setBackfillPkrEquivalent] = useState<number>(0);
  const [backfillSubmitting, setBackfillSubmitting] = useState(false);
  const [backfillError, setBackfillError] = useState("");

  useEffect(() => {
    listBankAccounts().then(setBankAccounts).catch(() => undefined);
  }, []);

  function loadOverview() {
    return getFinanceOverview().then(setOverview);
  }

  useEffect(() => {
    const request =
      activeTab === "Overview"
        ? loadOverview()
        : activeTab === "Income"
          ? listFinanceIncome().then(setIncome)
          : activeTab === "Expenses"
            ? listExpenses().then(setExpenses)
            : activeTab === "Bank Accounts"
              ? listBankAccounts().then(setBankAccounts)
              : listPayrollEntries(month).then(setEntries);
    request.catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false));
  }, [activeTab, month]);

  const visiblePayroll = useMemo(
    () =>
      entries.filter(
        (entry) =>
          (!search || entry.employeeName.toLowerCase().includes(search.toLowerCase())) &&
          (!status || entry.status === status),
      ),
    [entries, search, status],
  );
  const payrollTotals = useMemo(
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
  const paidPct = entries.length ? (payrollTotals.paidCount / entries.length) * 100 : 0;
  const monthLabel = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(
    new Date(`${month}-01T00:00:00`),
  );

  async function generate() {
    setConfirmGenerate(false);
    setError("");
    try {
      const generated = await generatePayroll(month);
      await listPayrollEntries(month).then(setEntries);
      toast.success(`Payroll generated for ${generated.length} employee${generated.length === 1 ? "" : "s"}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Payroll could not be generated.");
    }
  }

  function openMarkPaid(entry: PayrollEntry) {
    setPayTarget(entry);
    setPayBankAccountId(bankAccounts[0]?.id ?? "");
    setPayPkrEquivalent(0);
    setPayError("");
  }

  const payAccount = bankAccounts.find((account) => account.id === payBankAccountId) ?? null;

  async function submitMarkPaid(event: React.FormEvent) {
    event.preventDefault();
    if (!payTarget || !payBankAccountId) return;
    setPaySubmitting(true);
    setPayError("");
    try {
      await markPayrollPaid(payTarget.id, {
        bankAccountId: payBankAccountId,
        pkrEquivalent: payAccount && payAccount.currency !== "PKR" ? payPkrEquivalent : null,
      });
      await listPayrollEntries(month).then(setEntries);
      toast.success(`Marked ${payTarget.employeeName} as paid.`);
      setPayTarget(null);
    } catch (reason) {
      setPayError(reason instanceof Error ? reason.message : "Payroll entry could not be marked paid.");
    } finally {
      setPaySubmitting(false);
    }
  }

  function openBackfillBank(entry: PayrollEntry) {
    setBackfillTarget(entry);
    setBackfillBankAccountId(bankAccounts[0]?.id ?? "");
    setBackfillPkrEquivalent(0);
    setBackfillError("");
  }

  const backfillAccount = bankAccounts.find((account) => account.id === backfillBankAccountId) ?? null;

  async function submitBackfillBank(event: React.FormEvent) {
    event.preventDefault();
    if (!backfillTarget || !backfillBankAccountId) return;
    setBackfillSubmitting(true);
    setBackfillError("");
    try {
      await backfillPayrollBank(backfillTarget.id, {
        bankAccountId: backfillBankAccountId,
        pkrEquivalent: backfillAccount && backfillAccount.currency !== "PKR" ? backfillPkrEquivalent : null,
      });
      await listPayrollEntries(month).then(setEntries);
      toast.success(`Linked ${backfillTarget.employeeName}'s payroll to a bank account.`);
      setBackfillTarget(null);
    } catch (reason) {
      setBackfillError(reason instanceof Error ? reason.message : "Payroll entry could not be linked.");
    } finally {
      setBackfillSubmitting(false);
    }
  }

  async function removePayroll() {
    if (!confirmPayroll) return;
    const entry = confirmPayroll;
    setConfirmPayroll(null);
    try {
      await deletePayrollEntry(entry.id);
      await listPayrollEntries(month).then(setEntries);
      toast.success("Payroll entry deleted.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Payroll entry could not be deleted.");
    }
  }

  async function removeExpense() {
    if (!confirmExpense) return;
    const expense = confirmExpense;
    setConfirmExpense(null);
    try {
      await deleteExpense(expense.id);
      await listExpenses().then(setExpenses);
      toast.success("Expense deleted.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Expense could not be deleted.");
    }
  }

  const actions = activeTab === "Payroll" ? (
    <>
      <label className="relative flex h-10 items-center rounded-full bg-surface-container-high px-4">
        <Icon className="mr-2.5 text-[18px]">calendar_month</Icon>
        <input aria-label="Payroll month" type="month" value={month} onChange={(event) => { setLoading(true); setError(""); setMonth(event.target.value); }} className="w-32 bg-transparent text-sm font-medium text-on-surface outline-none" />
        <span className="pointer-events-none absolute inset-y-0 left-11 flex items-center bg-surface-container-high pr-3 text-sm font-medium">{monthLabel}</span>
      </label>
      <Button size="lg" onClick={() => setConfirmGenerate(true)}><Icon className="text-[18px]">add</Icon>Generate Payroll</Button>
      <Link to={`/finance/payroll/new?month=${month}`} className="inline-flex h-10 items-center gap-2 rounded-full bg-surface-container-highest px-5 text-sm font-medium text-on-surface ring-1 ring-outline-variant/40 hover:bg-surface-bright"><Icon className="text-[18px]">add</Icon>Add entry</Link>
    </>
  ) : activeTab === "Expenses" ? (
    <Link to="/finance/expenses/new" className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-on-primary shadow-md shadow-black/10 hover:brightness-105"><Icon className="text-[18px]">add</Icon>Add expense</Link>
  ) : activeTab === "Bank Accounts" ? (
    <Link to="/finance/bank-accounts/new" className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-on-primary shadow-md shadow-black/10 hover:brightness-105"><Icon className="text-[18px]">add</Icon>Add account</Link>
  ) : undefined;

  return (
    <div className="mx-auto max-w-[1540px] px-6 py-7">
      <PageHeader className="mb-8 px-1" title="Finance" description="Track cash flow, payroll, income, and expenses." actions={actions} />
      <nav className="mb-6 flex gap-8 border-b border-outline-variant/60">
        {tabs.map((tab) => <button key={tab} onClick={() => { setLoading(true); setError(""); setTabParam(tab.toLowerCase()); }} className={`relative whitespace-nowrap pb-3 text-sm font-medium tracking-wide transition ${activeTab === tab ? "text-primary" : "text-on-surface-variant hover:text-on-surface"}`}>{tab}{activeTab === tab && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-t-full bg-primary" />}</button>)}
      </nav>

      {error && <div className="mb-6 rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div>}
      {loading && <div className="grid min-h-40 place-items-center"><Loading /></div>}

      {!loading && activeTab === "Overview" && overview && <FinanceOverviewPanel overview={overview} />}
      {!loading && activeTab === "Income" && <section className="surface-panel overflow-hidden">{income.length ? <FinanceIncomeTable income={income} /> : <EmptyState>No project payments recorded yet.</EmptyState>}</section>}
      {!loading && activeTab === "Expenses" && (
        <section className="surface-panel overflow-hidden">{expenses.length ? <ExpensesTable expenses={expenses} onEdit={(expense) => navigate(`/finance/expenses/${expense.id}/edit`)} onCopy={(expense) => navigate("/finance/expenses/new", { state: { copyFrom: expense } })} onDelete={setConfirmExpense} /> : <EmptyState>No expenses recorded yet.</EmptyState>}</section>
      )}
      {!loading && activeTab === "Bank Accounts" && (
        <section className="surface-panel overflow-hidden">
          {bankAccounts.length ? (
            <BankAccountsTable
              accounts={bankAccounts}
              onSelect={(account) => navigate(`/finance/bank-accounts/${account.id}`)}
              onEdit={(account) => navigate(`/finance/bank-accounts/${account.id}/edit`)}
            />
          ) : (
            <EmptyState>No bank accounts added yet.</EmptyState>
          )}
        </section>
      )}
      {!loading && activeTab === "Payroll" && (
        <div className="space-y-6">
          <section className="surface-panel p-6"><PayrollSummary totalCount={entries.length} base={payrollTotals.base} adjustment={payrollTotals.adjustment} final={payrollTotals.final} currency={currency} paidCount={payrollTotals.paidCount} pendingCount={payrollTotals.pendingCount} paidPct={paidPct} /></section>
          <section className="surface-panel overflow-hidden">
            <div className="bg-surface-container-high/30 px-6 py-4"><FilterToolbar><SearchInput value={search} onChange={setSearch} placeholder="Search employees..." className="lg:max-w-[380px]" /><FilterSelect value={status} onChange={setStatus} labelText="Status" placeholder="Filter by status"><option value="PENDING">Pending</option><option value="PAID">Paid</option></FilterSelect>{(search || status) && <Button variant="ghost" size="sm" onClick={() => clearSearchParams(["search", "status"])}><Icon className="text-[16px]">filter_alt_off</Icon>Clear filters</Button>}</FilterToolbar></div>
            {entries.length ? <PayrollTable entries={visiblePayroll} onMarkPaid={openMarkPaid} onBackfillBank={openBackfillBank} onEdit={(entry) => navigate(`/finance/payroll/${entry.id}/edit?month=${month}`)} onDelete={setConfirmPayroll} /> : <EmptyState>No payroll entries for this month. Generate payroll or add an entry.</EmptyState>}
            {entries.length > 0 && !visiblePayroll.length && <EmptyState>No entries match these filters.</EmptyState>}
            <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-outline-variant/30 bg-surface-container-highest/20 px-7 py-4 text-sm text-on-surface-variant"><span>Showing {visiblePayroll.length} of {entries.length} employees</span></footer>
          </section>
        </div>
      )}

      <ConfirmDialog open={confirmGenerate} title={`Generate payroll for ${monthLabel}?`} description="This creates a pending payroll entry for every active employee who doesn't already have one this month." confirmLabel="Generate" tone="primary" onConfirm={generate} onCancel={() => setConfirmGenerate(false)} />
      <ConfirmDialog open={confirmPayroll !== null} title="Delete this payroll entry?" description={confirmPayroll ? `The entry for ${confirmPayroll.employeeName} will be permanently removed.` : undefined} confirmLabel="Delete entry" onConfirm={removePayroll} onCancel={() => setConfirmPayroll(null)} />
      <ConfirmDialog open={confirmExpense !== null} title="Delete this expense?" description={confirmExpense ? `"${confirmExpense.title}" will be permanently removed.` : undefined} confirmLabel="Delete expense" onConfirm={removeExpense} onCancel={() => setConfirmExpense(null)} />

      <FormDialog
        open={payTarget !== null}
        title="Mark payroll as paid"
        description={payTarget ? `Record a bank debit for ${payTarget.employeeName}'s ${payTarget.month} payroll.` : undefined}
        icon="payments"
        submitLabel="Mark paid"
        submittingLabel="Recording…"
        submitting={paySubmitting}
        submitDisabled={!payBankAccountId}
        error={payError}
        onSubmit={submitMarkPaid}
        onClose={() => setPayTarget(null)}
      >
        <div className="grid gap-4">
          <FormField label="Source bank account">
            <Select
              value={payBankAccountId}
              onChange={(event) => setPayBankAccountId(Number(event.target.value))}
              required
            >
              <option value="" disabled hidden>Select bank account</option>
              {bankAccounts.map((account) => (
                <option key={account.id} value={account.id}>{account.name} ({account.currency})</option>
              ))}
            </Select>
          </FormField>
          {payAccount && payAccount.currency !== "PKR" && (
            <FormField label="PKR equivalent">
              <MoneyInput value={payPkrEquivalent} onChange={setPayPkrEquivalent} required />
            </FormField>
          )}
        </div>
      </FormDialog>

      <FormDialog
        open={backfillTarget !== null}
        title="Link to a bank account"
        description={
          backfillTarget
            ? `This entry was marked paid before bank tracking existed. Record the bank debit for ${backfillTarget.employeeName}'s ${backfillTarget.month} payroll now.`
            : undefined
        }
        icon="account_balance"
        submitLabel="Link account"
        submittingLabel="Linking…"
        submitting={backfillSubmitting}
        submitDisabled={!backfillBankAccountId}
        error={backfillError}
        onSubmit={submitBackfillBank}
        onClose={() => setBackfillTarget(null)}
      >
        <div className="grid gap-4">
          <FormField label="Source bank account">
            <Select
              value={backfillBankAccountId}
              onChange={(event) => setBackfillBankAccountId(Number(event.target.value))}
              required
            >
              <option value="" disabled hidden>Select bank account</option>
              {bankAccounts.map((account) => (
                <option key={account.id} value={account.id}>{account.name} ({account.currency})</option>
              ))}
            </Select>
          </FormField>
          {backfillAccount && backfillAccount.currency !== "PKR" && (
            <FormField label="PKR equivalent">
              <MoneyInput value={backfillPkrEquivalent} onChange={setBackfillPkrEquivalent} required />
            </FormField>
          )}
        </div>
      </FormDialog>
    </div>
  );
}
