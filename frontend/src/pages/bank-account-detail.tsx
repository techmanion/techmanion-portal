import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Icon, Loading } from "../components/atoms";
import { StatusChip } from "../components/atoms/Badge";
import { Breadcrumb, EmptyState } from "../components/molecules";
import { BankAccountInfoPanel, BankTransactionsPanel } from "../components/organisms";
import {
  addBankCredit,
  addBankDebit,
  createBankTransfer,
  getBankAccount,
  listBankAccounts,
} from "../lib/api/finance";
import { useToast } from "../toast";
import type { BankAccount, BankTransactionPayload, BankTransferPayload } from "../types";

export function BankAccountDetailPage() {
  const { accountId } = useParams();
  const toast = useToast();
  const [account, setAccount] = useState<BankAccount | null>(null);
  const [otherAccounts, setOtherAccounts] = useState<BankAccount[]>([]);
  const [error, setError] = useState("");

  function reload() {
    return Promise.all([getBankAccount(Number(accountId)), listBankAccounts()]).then(
      ([current, all]) => {
        setAccount(current);
        setOtherAccounts(all.filter((row) => row.id !== current.id && row.isActive));
      },
    );
  }

  useEffect(() => {
    reload().catch((reason: Error) => setError(reason.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]);

  async function addCredit(payload: BankTransactionPayload) {
    try {
      const updated = await addBankCredit(Number(accountId), payload);
      setAccount(updated);
      toast.success("Credit recorded.");
    } catch (reason) {
      throw reason instanceof Error ? reason : new Error("Credit could not be recorded.");
    }
  }

  async function addDebit(payload: BankTransactionPayload) {
    try {
      const updated = await addBankDebit(Number(accountId), payload);
      setAccount(updated);
      toast.success("Debit recorded.");
    } catch (reason) {
      throw reason instanceof Error ? reason : new Error("Debit could not be recorded.");
    }
  }

  async function transfer(payload: BankTransferPayload) {
    try {
      const result = await createBankTransfer(payload);
      setAccount(result.sourceAccount);
      setOtherAccounts((current) =>
        current.map((row) => (row.id === result.destinationAccount.id ? result.destinationAccount : row)),
      );
      toast.success("Transfer completed.");
    } catch (reason) {
      throw reason instanceof Error ? reason : new Error("Transfer could not be completed.");
    }
  }

  if (!account && !error) {
    return (
      <div className="grid min-h-[70vh] place-items-center">
        <Loading />
      </div>
    );
  }
  if (!account) {
    return (
      <div className="p-6">
        <EmptyState>{error}</EmptyState>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-7">
      <Breadcrumb to="/finance?tab=bank%20accounts" trail={["Finance", "Bank Accounts", account.name]} />

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-title font-semibold tracking-tight">{account.name}</h1>
          <p className="mt-1.5 text-sm text-on-surface-variant">{account.bankName}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <StatusChip value={account.isActive ? "ACTIVE" : "INACTIVE"} />
          <Link
            to={`/finance/bank-accounts/${account.id}/edit`}
            className="inline-flex h-9 items-center gap-2 rounded-full bg-surface-container-highest px-4 text-sm font-medium text-on-surface ring-1 ring-outline-variant/40 hover:bg-surface-bright"
          >
            <Icon className="text-[16px]">edit</Icon>
            Edit
          </Link>
        </div>
      </div>

      <BankAccountInfoPanel account={account} />
      <BankTransactionsPanel
        account={account}
        otherAccounts={otherAccounts}
        onAddCredit={addCredit}
        onAddDebit={addDebit}
        onTransfer={transfer}
      />
      {error && <div className="mt-6 rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div>}
    </div>
  );
}
