import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Button, Icon, Loading } from "../components/atoms";
import { getPayrollEntry } from "../lib/api/finance";
import { getOrganization } from "../lib/api/organization";
import { currentMonth } from "../lib/format";
import { buildSalarySlip, formatSlipAmount, formatSlipMonth, slipEmploymentType } from "../lib/salarySlip";
import type { Organization, PayrollEntry } from "../types";

const DEFAULT_ADDRESS = "1-A1, Commercial Zone Block A1 Valencia, Lahore, 54000";
const DEFAULT_WEBSITE = "www.techmanion.com";
const BORDER = "border border-[#d9d9d9]";
const CELL = `${BORDER} w-[38.2%] px-3 py-3.5`;

function SlipLogo() {
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 60 60" className="size-[60px]" aria-hidden="true">
        <rect width="60" height="60" fill="#000000" />
        <rect x="15" y="17" width="30" height="5" fill="#72ff13" />
        <rect x="27.5" y="22" width="5" height="21" fill="#72ff13" />
      </svg>
      <div className="leading-none">
        <div className="text-[27px] font-semibold tracking-tight">TECHMANION</div>
        <div className="mt-1.5 text-[14px] tracking-wide">YOUR TECH COMPANION</div>
      </div>
    </div>
  );
}

export function SalarySlipPage() {
  const { entryId } = useParams();
  const [searchParams] = useSearchParams();
  const month = searchParams.get("month") ?? currentMonth();
  const [entry, setEntry] = useState<PayrollEntry | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      getPayrollEntry(month, Number(entryId)),
      getOrganization().catch(() => null),
    ])
      .then(([row, profile]) => {
        setOrganization(profile);
        if (row) setEntry(row);
        else setError("Payroll entry was not found.");
      })
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }, [entryId, month]);

  useEffect(() => {
    if (!entry) return;
    // The print dialog offers the document title as the PDF's file name.
    document.title = `Salary Slip - ${entry.employeeName} - ${formatSlipMonth(entry.month)}`;
  }, [entry]);

  if (loading) return <div className="grid min-h-screen place-items-center bg-background"><Loading /></div>;
  if (!entry) return <div className="grid min-h-screen place-items-center bg-background text-sm text-on-surface-variant">{error || "Payroll entry was not found."}</div>;

  const slip = buildSalarySlip(entry);
  const details = [
    ["Employee Name", entry.employeeName],
    ["Designation", entry.designationName ?? "—"],
    ["Employee ID", entry.employeeCode ?? "—"],
    ["Employment Type", slipEmploymentType(entry.employeeType)],
  ];

  return (
    <div className="min-h-screen bg-background py-6 print:min-h-0 print:bg-white print:py-0">
      <style>{"@page { size: A4; margin: 0; }"}</style>
      <div className="mx-auto mb-4 flex w-[794px] max-w-full items-center justify-between gap-4 px-2 print:hidden">
        <p className="text-sm text-on-surface-variant">
          {entry.status === "PAID" ? "Choose Save as PDF in the print dialog to share this slip." : "This payroll entry hasn't been marked paid yet."}
        </p>
        <Button onClick={() => window.print()}><Icon className="text-[18px]">print</Icon>Print</Button>
      </div>
      <main className="mx-auto min-h-[1123px] w-[794px] bg-white px-[60px] pt-[50px] pb-10 text-[#000000] shadow-panel [print-color-adjust:exact] print:min-h-0 print:shadow-none">
        <SlipLogo />
        <h1 className="mt-10 text-center text-[21px] font-semibold">SALARY SLIP ({formatSlipMonth(entry.month)})</h1>

        <table className="mt-12 w-full border-collapse text-[16px]">
          <tbody>
            {details.map(([name, value]) => (
              <tr key={name}>
                <th scope="row" className={`${CELL} text-left font-semibold`}>{name}</th>
                <td className={`${BORDER} px-3 py-3.5`}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <table className="mt-8 w-full border-collapse text-[16px]">
          <thead>
            <tr className="bg-[#ececea]">
              <th scope="col" className={`${CELL} text-left font-semibold`}>Salary Type</th>
              <th scope="col" className={`${BORDER} px-3 py-3.5 text-left font-semibold`}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {slip.earnings.map((row) => (
              <tr key={row.label}>
                <td className={CELL}>{row.label}</td>
                <td className={`${BORDER} px-3 py-3.5`}>{formatSlipAmount(row.amount, entry.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <table className="mt-5 w-full border-collapse text-[16px]">
          <tbody>
            <tr>
              <td className={CELL}>Total Earnings</td>
              <td className={`${BORDER} px-3 py-3.5`}>{formatSlipAmount(slip.totalEarnings, entry.currency)}</td>
            </tr>
            <tr>
              <td className={CELL}>Total Deductions</td>
              <td className={`${BORDER} px-3 py-3.5`}>{formatSlipAmount(slip.totalDeductions, entry.currency)}</td>
            </tr>
            <tr className="bg-[#f0f0f0] font-semibold">
              <td className={CELL}>Total Net Salary</td>
              <td className={`${BORDER} px-3 py-3.5`}>{entry.currency} {formatSlipAmount(slip.netSalary, entry.currency)}</td>
            </tr>
          </tbody>
        </table>

        <p className="mt-5 text-[13px]">This is a system generated Pay Statement and does not require any signature</p>

        <footer className="mt-28 text-right text-[14px] leading-relaxed">
          <div className="text-[15px] font-semibold">OFFICE ADDRESS</div>
          <div>{organization?.address || DEFAULT_ADDRESS}</div>
          <div>{organization?.website || DEFAULT_WEBSITE}</div>
        </footer>
      </main>
    </div>
  );
}
