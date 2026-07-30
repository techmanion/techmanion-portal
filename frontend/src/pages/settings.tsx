import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import { Button, Icon, Input } from "../components/atoms";
import { SectionHeading } from "../components/atoms/Typography";
import { FormField } from "../components/molecules";
import { PageHeader } from "../components/organisms";
import { api } from "../lib/api";
import type { NamedOption } from "../types";

export function SettingsPage() {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<NamedOption[]>([]);
  const [designations, setDesignations] = useState<NamedOption[]>([]);
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [error, setError] = useState("");

  function load() {
    Promise.all([
      api<NamedOption[]>("/settings/departments"),
      api<NamedOption[]>("/settings/designations"),
    ])
      .then(([departmentRows, designationRows]) => {
        setDepartments(departmentRows); setDesignations(designationRows);
      })
      .catch(() => undefined);
  }
  useEffect(load, [user?.role]);

  async function add(kind: "departments" | "designations", name: string) {
    try {
      await api(`/settings/${kind}?name=${encodeURIComponent(name)}`, { method: "POST" });
      if (kind === "departments") setDepartment(""); else setDesignation("");
      load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Organization list could not be updated.");
    }
  }

  return (
    <div className="mx-auto max-w-[1450px] px-6 py-8">
      <PageHeader
        className="mb-8 px-1"
        title="Organization"
        description="Manage company departments and job titles."
      />
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
      {error && <div className="mt-6 rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div>}
    </div>
  );
}
