import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loading } from "../components/atoms";
import { Breadcrumb, EmptyState } from "../components/molecules";
import { BankAccountFormPanel, PageHeader } from "../components/organisms";
import { createBankAccount, getBankAccount, updateBankAccount } from "../lib/api/finance";
import { useToast } from "../toast";
import type { BankAccount, BankAccountPayload } from "../types";

export function BankAccountFormPage() {
  const { accountId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const isEdit = Boolean(accountId);
  const [account, setAccount] = useState<BankAccount | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState("");
  const cancelTo = "/finance?tab=bank%20accounts";

  useEffect(() => {
    if (!accountId) return;
    getBankAccount(Number(accountId))
      .then(setAccount)
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }, [accountId]);

  async function save(payload: BankAccountPayload) {
    if (isEdit) await updateBankAccount(Number(accountId), payload);
    else await createBankAccount(payload);
    toast.success(isEdit ? "Bank account updated." : "Bank account added.");
    navigate(cancelTo);
  }

  if (loading) return <div className="grid min-h-[70vh] place-items-center"><Loading /></div>;
  if (isEdit && !account) return <div className="p-6"><EmptyState>{error || "Bank account was not found."}</EmptyState></div>;

  return (
    <div className="mx-auto max-w-[920px] px-6 py-7">
      <div className="mb-7">
        <Breadcrumb to={cancelTo} trail={["Finance", "Bank Accounts", isEdit ? "Edit" : "New"]} />
        <PageHeader
          className="mt-5 px-1"
          title={isEdit ? "Edit bank account" : "New bank account"}
          description="Track a company bank or payment account and its opening balance."
        />
      </div>
      <BankAccountFormPanel account={account} onSubmit={save} onCancel={() => navigate(cancelTo)} />
    </div>
  );
}
