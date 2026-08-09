import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Loading } from "../components/atoms";
import { Breadcrumb, EmptyState } from "../components/molecules";
import { ExpenseFormPanel, PageHeader } from "../components/organisms";
import { createExpense, getExpense, listBankAccounts, updateExpense } from "../lib/api/finance";
import { useToast } from "../toast";
import type { BankAccount, Expense, ExpensePayload } from "../types";

export function ExpenseFormPage() {
  const { expenseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const isEdit = Boolean(expenseId);
  const copyFrom = (location.state as { copyFrom?: Expense } | null)?.copyFrom ?? null;
  const [expense, setExpense] = useState<Expense | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState("");
  const cancelTo = "/finance?tab=expenses";

  useEffect(() => {
    listBankAccounts().then(setBankAccounts).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!expenseId) return;
    getExpense(Number(expenseId))
      .then((row) => {
        if (row) setExpense(row);
        else setError("Expense was not found.");
      })
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }, [expenseId]);

  async function save(payload: ExpensePayload) {
    if (isEdit) await updateExpense(Number(expenseId), payload);
    else await createExpense(payload);
    toast.success(isEdit ? "Expense updated." : copyFrom ? "Expense copied." : "Expense added.");
    navigate(cancelTo);
  }

  if (loading) return <div className="grid min-h-[70vh] place-items-center"><Loading /></div>;
  if (isEdit && !expense) return <div className="p-6"><EmptyState>{error || "Expense was not found."}</EmptyState></div>;

  const title = isEdit ? "Edit expense" : copyFrom ? "Copy expense" : "New expense";

  return (
    <div className="mx-auto max-w-[920px] px-6 py-7">
      <div className="mb-7">
        <Breadcrumb to={cancelTo} trail={["Finance", "Expenses", isEdit ? "Edit" : copyFrom ? "Copy" : "New"]} />
        <PageHeader
          className="mt-5 px-1"
          title={title}
          description="Record the expense details and recurrence settings."
        />
      </div>
      <ExpenseFormPanel
        expense={expense}
        copyFrom={copyFrom}
        bankAccounts={bankAccounts}
        onSubmit={save}
        onCancel={() => navigate(cancelTo)}
      />
    </div>
  );
}
