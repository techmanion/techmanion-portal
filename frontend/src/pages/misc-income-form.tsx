import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Loading } from "../components/atoms";
import { Breadcrumb, EmptyState } from "../components/molecules";
import { MiscIncomeFormPanel, PageHeader } from "../components/organisms";
import { createMiscIncome, getMiscIncome, listBankAccounts, updateMiscIncome } from "../lib/api/finance";
import { useToast } from "../toast";
import type { BankAccount, MiscIncome, MiscIncomePayload } from "../types";

export function MiscIncomeFormPage() {
  const { incomeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const isEdit = Boolean(incomeId);
  const copyFrom = (location.state as { copyFrom?: MiscIncome } | null)?.copyFrom ?? null;
  const [miscIncome, setMiscIncome] = useState<MiscIncome | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState("");
  const cancelTo = "/finance?tab=income";

  useEffect(() => {
    listBankAccounts().then(setBankAccounts).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!incomeId) return;
    getMiscIncome(Number(incomeId))
      .then((row) => {
        if (row) setMiscIncome(row);
        else setError("Income was not found.");
      })
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }, [incomeId]);

  async function save(payload: MiscIncomePayload) {
    if (isEdit) await updateMiscIncome(Number(incomeId), payload);
    else await createMiscIncome(payload);
    toast.success(isEdit ? "Income updated." : copyFrom ? "Income copied." : "Income added.");
    navigate(cancelTo);
  }

  if (loading) return <div className="grid min-h-[70vh] place-items-center"><Loading /></div>;
  if (isEdit && !miscIncome) return <div className="p-6"><EmptyState>{error || "Income was not found."}</EmptyState></div>;

  const title = isEdit ? "Edit income" : copyFrom ? "Copy income" : "New income";

  return (
    <div className="mx-auto max-w-[920px] px-6 py-7">
      <div className="mb-7">
        <Breadcrumb to={cancelTo} trail={["Finance", "Income", isEdit ? "Edit" : copyFrom ? "Copy" : "New"]} />
        <PageHeader
          className="mt-5 px-1"
          title={title}
          description="Record a miscellaneous income entry not tied to a project."
        />
      </div>
      <MiscIncomeFormPanel
        miscIncome={miscIncome}
        copyFrom={copyFrom}
        bankAccounts={bankAccounts}
        onSubmit={save}
        onCancel={() => navigate(cancelTo)}
      />
    </div>
  );
}
