import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import { Button, Icon, Input } from "../components/atoms";
import { SectionHeading } from "../components/atoms/Typography";
import { EmptyState, FormField } from "../components/molecules";
import { DataTable, TableHeadRow, TableRow } from "../components/organisms";
import { api } from "../lib/api";
import { formatDate } from "../lib/format";
import type { AuditLog, NamedOption, TaxSlab } from "../types";

export function SettingsPage() {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<NamedOption[]>([]);
  const [designations, setDesignations] = useState<NamedOption[]>([]);
  const [slabs, setSlabs] = useState<TaxSlab[]>([]);
  const [audits, setAudits] = useState<AuditLog[]>([]);
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [taxForm, setTaxForm] = useState({
    fiscalYear: "2026-27",
    lowerBound: "",
    upperBound: "",
    fixedAmount: "",
    ratePercent: "",
  });

  function load() {
    Promise.all([
      api<NamedOption[]>("/settings/departments"),
      api<NamedOption[]>("/settings/designations"),
      api<TaxSlab[]>("/settings/tax-slabs"),
      user?.role === "ADMIN" ? api<AuditLog[]>("/audit") : Promise.resolve([]),
    ])
      .then(([departmentRows, designationRows, taxRows, auditRows]) => {
        setDepartments(departmentRows); setDesignations(designationRows); setSlabs(taxRows); setAudits(auditRows);
      })
      .catch(() => undefined);
  }
  useEffect(load, [user?.role]);

  async function add(kind: "departments" | "designations", name: string) {
    await api(`/settings/${kind}?name=${encodeURIComponent(name)}`, { method: "POST" });
    if (kind === "departments") setDepartment(""); else setDesignation("");
    load();
  }

  async function addTaxSlab(event: React.FormEvent) {
    event.preventDefault();
    await api("/settings/tax-slabs", {
      method: "POST",
      body: JSON.stringify({
        fiscalYear: taxForm.fiscalYear,
        lowerBound: Math.round(Number(taxForm.lowerBound) * 100),
        upperBound: taxForm.upperBound ? Math.round(Number(taxForm.upperBound) * 100) : null,
        fixedAmount: Math.round(Number(taxForm.fixedAmount || 0) * 100),
        rateBpsOverLower: Math.round(Number(taxForm.ratePercent || 0) * 100),
      }),
    });
    setTaxForm((current) => ({ ...current, lowerBound: "", upperBound: "", fixedAmount: "", ratePercent: "" }));
    load();
  }

  return (
    <div className="mx-auto max-w-[1450px] px-6 py-8">
      <div className="mb-7">
        <h1 className="text-title font-semibold tracking-tight">Organization</h1>
        <p className="mt-1.5 text-sm text-on-surface-variant">Company lists, tax configuration, and audit history.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-panel p-6">
          <SectionHeading className="mb-5"><Icon className="text-primary">hub</Icon>Departments</SectionHeading>
          <ul className="mb-6 divide-y divide-outline-variant/30">{departments.map((item) => <li className="py-3 text-sm" key={item.id}>{item.name}</li>)}</ul>
          {user?.role === "ADMIN" && <div className="flex items-end gap-2.5"><FormField className="flex-1" label="New department"><Input value={department} onChange={(e) => setDepartment(e.target.value)} /></FormField><Button variant="secondary" onClick={() => add("departments", department)} disabled={!department}>Add</Button></div>}
        </section>
        <section className="surface-panel p-6">
          <SectionHeading accent="tertiary" className="mb-5"><Icon className="text-tertiary">badge</Icon>Designations</SectionHeading>
          <ul className="mb-6 divide-y divide-outline-variant/30">{designations.map((item) => <li className="py-3 text-sm" key={item.id}>{item.name}</li>)}</ul>
          {user?.role === "ADMIN" && <div className="flex items-end gap-2.5"><FormField className="flex-1" label="New designation"><Input value={designation} onChange={(e) => setDesignation(e.target.value)} /></FormField><Button variant="secondary" onClick={() => add("designations", designation)} disabled={!designation}>Add</Button></div>}
        </section>
      </div>
      <section className="surface-panel mt-6 p-6">
        <SectionHeading className="mb-5"><Icon className="text-primary">description</Icon>Pakistan tax slabs</SectionHeading>
        {slabs.length === 0 ? <EmptyState>No tax slabs configured. Payroll will withhold zero tax until a slab is added below.</EmptyState> : (
          <DataTable minWidth="700px">
            <thead>
              <TableHeadRow>
                <th className="px-4 py-3">Fiscal year</th>
                <th className="px-4 py-3">Lower bound</th>
                <th className="px-4 py-3">Upper bound</th>
                <th className="px-4 py-3">Rate over lower</th>
              </TableHeadRow>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {slabs.map((slab) => (
                <TableRow key={slab.id}>
                  <td className="px-4 text-sm">{slab.fiscalYear}</td>
                  <td className="px-4 text-sm">{slab.lowerBound}</td>
                  <td className="px-4 text-sm">{slab.upperBound ?? "No limit"}</td>
                  <td className="px-4 text-sm">{slab.rateBpsOverLower / 100}%</td>
                </TableRow>
              ))}
            </tbody>
          </DataTable>
        )}
        {user?.role === "ADMIN" && (
          <form className="mt-6 grid items-end gap-3.5 border-t border-outline-variant/30 pt-6 md:grid-cols-2 xl:grid-cols-6" onSubmit={addTaxSlab}>
            <FormField label="Fiscal year"><Input value={taxForm.fiscalYear} pattern="\d{4}-\d{2}" onChange={(e) => setTaxForm({ ...taxForm, fiscalYear: e.target.value })} required /></FormField>
            <FormField label="Lower bound (PKR)"><Input type="number" min="0" value={taxForm.lowerBound} onChange={(e) => setTaxForm({ ...taxForm, lowerBound: e.target.value })} required /></FormField>
            <FormField label="Upper bound (PKR)"><Input type="number" min="0" value={taxForm.upperBound} onChange={(e) => setTaxForm({ ...taxForm, upperBound: e.target.value })} /></FormField>
            <FormField label="Fixed tax (PKR)"><Input type="number" min="0" value={taxForm.fixedAmount} onChange={(e) => setTaxForm({ ...taxForm, fixedAmount: e.target.value })} /></FormField>
            <FormField label="Rate over lower (%)"><Input type="number" min="0" max="100" step="0.01" value={taxForm.ratePercent} onChange={(e) => setTaxForm({ ...taxForm, ratePercent: e.target.value })} /></FormField>
            <Button type="submit" variant="secondary">Add tax slab</Button>
          </form>
        )}
      </section>
      {user?.role === "ADMIN" && (
        <section className="surface-panel mt-6 p-6">
          <SectionHeading accent="tertiary" className="mb-5"><Icon className="text-tertiary">history</Icon>Audit log</SectionHeading>
          <DataTable minWidth="700px">
            <thead>
              <TableHeadRow>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Date</th>
              </TableHeadRow>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {audits.map((row) => (
                <TableRow key={row.id}>
                  <td className="px-4 text-sm">{row.action}</td>
                  <td className="px-4 text-sm">{row.entityType} #{row.entityId}</td>
                  <td className="px-4 text-sm">User #{row.actorUserId}</td>
                  <td className="px-4 text-sm">{formatDate(row.createdAt)}</td>
                </TableRow>
              ))}
            </tbody>
          </DataTable>
        </section>
      )}
    </div>
  );
}
