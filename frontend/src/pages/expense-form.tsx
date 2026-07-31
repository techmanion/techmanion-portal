import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loading } from "../components/atoms";
import { Breadcrumb, EmptyState } from "../components/molecules";
import { ExpenseFormPanel, PageHeader } from "../components/organisms";
import { createExpense, getExpense, updateExpense } from "../lib/api/finance";
import { useToast } from "../toast";
import type { Expense, ExpensePayload } from "../types";

export function ExpenseFormPage() {
  const { expenseId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const isEdit = Boolean(expenseId);
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState("");
  const cancelTo = "/finance?tab=expenses";

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
    toast.success(isEdit ? "Expense updated." : "Expense added.");
    navigate(cancelTo);
  }

  if (loading) return <div className="grid min-h-[70vh] place-items-center"><Loading /></div>;
  if (isEdit && !expense) return <div className="p-6"><EmptyState>{error || "Expense was not found."}</EmptyState></div>;

  return (
    <div className="mx-auto max-w-[920px] px-6 py-7">
      <div className="mb-7">
        <Breadcrumb to={cancelTo} trail={["Finance", "Expenses", isEdit ? "Edit" : "New"]} />
        <PageHeader
          className="mt-5 px-1"
          title={isEdit ? "Edit expense" : "New expense"}
          description="Record the expense details and recurrence settings."
        />
      </div>
      <ExpenseFormPanel expense={expense} onSubmit={save} onCancel={() => navigate(cancelTo)} />
    </div>
  );
}
