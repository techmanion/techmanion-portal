import { CalendarPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button, Card, EmptyState, Input, PageHeader, StatusChip } from "../components/ui";
import { api } from "../lib/api";
import { formatMoney } from "../lib/format";
import type { PayrollRun } from "../types";

export function PayrollPage() {
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [error, setError] = useState("");

  function load() {
    api<PayrollRun[]>("/payroll").then((rows) => {
      setRuns(rows);
      setSelectedId((current) => current ?? rows[0]?.id ?? null);
    }).catch((reason: Error) => setError(reason.message));
  }
  useEffect(load, []);
  const selected = useMemo(() => runs.find((run) => run.id === selectedId), [runs, selectedId]);

  async function createRun() {
    setError("");
    try {
      const run = await api<PayrollRun>(`/payroll/${month}`, { method: "POST" });
      setRuns((current) => [run, ...current]);
      setSelectedId(run.id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Payroll could not be created.");
    }
  }

  async function markPaid(payslipId: number, netAmount: number) {
    await api(`/payslips/${payslipId}/payment`, {
      method: "PATCH",
      body: JSON.stringify({ paymentStatus: "PAID", paidAmount: netAmount }),
    });
    load();
  }

  return (
    <>
      <PageHeader
        title="Payroll"
        description="Fixed monthly salary runs and payment status."
        action={
          <div className="inline-action">
            <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
            <Button onClick={createRun}><CalendarPlus size={18} /> Run payroll</Button>
          </div>
        }
      />
      {runs.length > 0 && (
        <div className="tabs">
          {runs.map((run) => (
            <button key={run.id} className={run.id === selectedId ? "active" : ""} onClick={() => setSelectedId(run.id)}>
              {run.periodMonth}
            </button>
          ))}
        </div>
      )}
      <Card>
        {!selected ? (
          <EmptyState>Choose a month and run payroll for all active employees.</EmptyState>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Employee</th><th className="numeric">Base</th><th className="numeric">Tax</th><th className="numeric">Net</th><th>Status</th><th aria-label="Actions" /></tr></thead>
              <tbody>
                {selected.payslips.map((payslip) => (
                  <tr key={payslip.id}>
                    <td><strong>{payslip.employeeName}</strong></td>
                    <td className="numeric">{formatMoney(payslip.baseAmount, payslip.currency)}</td>
                    <td className="numeric">{formatMoney(payslip.taxAmount, payslip.currency)}</td>
                    <td className="numeric"><strong>{formatMoney(payslip.netAmount, payslip.currency)}</strong></td>
                    <td><StatusChip value={payslip.paymentStatus} /></td>
                    <td className="actions-cell">
                      {payslip.paymentStatus !== "PAID" && <Button variant="text" onClick={() => markPaid(payslip.id, payslip.netAmount)}>Mark paid</Button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {selected.payslips.length === 0 && <EmptyState>No active salaried employees were found.</EmptyState>}
          </div>
        )}
      </Card>
      {error && <div className="form-error page-error">{error}</div>}
    </>
  );
}
