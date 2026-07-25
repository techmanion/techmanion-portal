import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import { Button, Card, EmptyState, Field, Input, PageHeader } from "../components/ui";
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
    ]).then(([departmentRows, designationRows, taxRows, auditRows]) => {
      setDepartments(departmentRows); setDesignations(designationRows); setSlabs(taxRows); setAudits(auditRows);
    });
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
    <>
      <PageHeader title="Settings" description="Company lists, tax configuration, and audit history." />
      <div className="settings-grid">
        <Card>
          <h2>Departments</h2>
          <ul className="simple-list">{departments.map((item) => <li key={item.id}>{item.name}</li>)}</ul>
          {user?.role === "ADMIN" && <div className="add-row"><Field label="New department"><Input value={department} onChange={(e) => setDepartment(e.target.value)} /></Field><Button variant="outline" onClick={() => add("departments", department)} disabled={!department}>Add</Button></div>}
        </Card>
        <Card>
          <h2>Designations</h2>
          <ul className="simple-list">{designations.map((item) => <li key={item.id}>{item.name}</li>)}</ul>
          {user?.role === "ADMIN" && <div className="add-row"><Field label="New designation"><Input value={designation} onChange={(e) => setDesignation(e.target.value)} /></Field><Button variant="outline" onClick={() => add("designations", designation)} disabled={!designation}>Add</Button></div>}
        </Card>
      </div>
      <Card>
        <h2>Pakistan tax slabs</h2>
        {slabs.length === 0 ? <EmptyState>No tax slabs configured. Payroll will withhold zero tax until a slab is added below.</EmptyState> : (
          <div className="table-wrap"><table><thead><tr><th>Fiscal year</th><th>Lower bound</th><th>Upper bound</th><th>Rate over lower</th></tr></thead><tbody>{slabs.map((slab) => <tr key={slab.id}><td>{slab.fiscalYear}</td><td>{slab.lowerBound}</td><td>{slab.upperBound ?? "No limit"}</td><td>{slab.rateBpsOverLower / 100}%</td></tr>)}</tbody></table></div>
        )}
        {user?.role === "ADMIN" && (
          <form className="tax-form" onSubmit={addTaxSlab}>
            <Field label="Fiscal year"><Input value={taxForm.fiscalYear} pattern="\d{4}-\d{2}" onChange={(e) => setTaxForm({ ...taxForm, fiscalYear: e.target.value })} required /></Field>
            <Field label="Lower bound (PKR)"><Input type="number" min="0" value={taxForm.lowerBound} onChange={(e) => setTaxForm({ ...taxForm, lowerBound: e.target.value })} required /></Field>
            <Field label="Upper bound (PKR)"><Input type="number" min="0" value={taxForm.upperBound} onChange={(e) => setTaxForm({ ...taxForm, upperBound: e.target.value })} /></Field>
            <Field label="Fixed tax (PKR)"><Input type="number" min="0" value={taxForm.fixedAmount} onChange={(e) => setTaxForm({ ...taxForm, fixedAmount: e.target.value })} /></Field>
            <Field label="Rate over lower (%)"><Input type="number" min="0" max="100" step="0.01" value={taxForm.ratePercent} onChange={(e) => setTaxForm({ ...taxForm, ratePercent: e.target.value })} /></Field>
            <Button type="submit" variant="outline">Add tax slab</Button>
          </form>
        )}
      </Card>
      {user?.role === "ADMIN" && (
        <Card>
          <h2>Audit log</h2>
          <div className="table-wrap">
            <table><thead><tr><th>Action</th><th>Entity</th><th>Actor</th><th>Date</th></tr></thead><tbody>{audits.map((row) => <tr key={row.id}><td>{row.action}</td><td>{row.entityType} #{row.entityId}</td><td>User #{row.actorUserId}</td><td>{formatDate(row.createdAt)}</td></tr>)}</tbody></table>
          </div>
        </Card>
      )}
    </>
  );
}
