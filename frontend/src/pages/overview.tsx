import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Avatar, Icon, StatusChip } from "../components/atoms";
import { SectionHeading } from "../components/atoms/Typography";
import { EmptyState } from "../components/molecules";
import { PageHeader } from "../components/organisms";
import { api } from "../lib/api";
import { formatDate, formatMoney } from "../lib/format";
import type { Employee, PayrollRun, Project } from "../types";

const avatars = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAYo5IyKq4X8hfKEl_lkeW-e4U74MqO7VViu1lZQZnpmCvl2hw6iIqQOujI6lxBlLMLvShIJFap-cIWldvcvh0vuvecQLFajBM2vTH3uNSlcCc9ElT5ZdUXIPWWxUPQReCkAL1oNV6ZFctqgdwpPTDlSZuVjOE_rnENYw0NjZ9gbcHu6PIrhwDk1eJLJeyMeHGS1Be8IzuPyj1OW8g25gkrQYHPSHg0kKjY64ZoEHdM7MXmNBA_CcbfbERyHcZYSOOpF9ifdksLr3b5",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA5kkZZPNaNIENoWampmaw5bVKcAoszuU2mM9jTeelTnyh0JyOlPNed4z_8e71zgl6zk5w5zbMbQFZqX2cg3oLaC_TOS3USozLEff6eNucwUCXIVgiNxHGmapwbJGIpsVQzwpPqHH42smFmPEdX-bhFTluPvxhFpfb8ffrdmmcjXOInfE1oLR8GuIz_CTBJ5r9kWKzEe0Upzh9qMGYF2kHggSTXoMYhCs4ks_vaf3espYNyuutN1LPHK1uSwBVsFFh88ZjUT8lyVJvA",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCM-HRB1vIIG-UWgEuoyBr984uaTy_mokXHIQnvr2nR6yv6FTizlvF8tbhmUWoBdPnAv7kpf-F_73sFLHEgKvagMYEoAbfVC8lF3rVQXGbZ3oRRSjW3YLl5d_8n8_PCZc0pTP34n67e2F5g8LyqXeQgUmjQqcWJfvcgyM_LMZEkKmll1k3QnGzNCN544E5NuMGk0MtAb7_e9H2dc245yxj76kmpuEvpyuNNFONVnfHlo0-qdTCdulIQZg0RkDIZCgRdDwnIOLdXHBzB",
];

function StatCard({
  icon,
  labelText,
  value,
  hint,
  tone = "default",
}: {
  icon: string;
  labelText: string;
  value: string;
  hint: string;
  tone?: "default" | "primary" | "tertiary";
}) {
  return (
    <div className="surface-panel flex items-start justify-between gap-3 p-5">
      <div className="min-w-0">
        <span className="block text-xs font-semibold uppercase tracking-[0.1em] text-on-surface-variant">{labelText}</span>
        <strong
          className={`mt-2 block truncate text-title font-semibold leading-tight ${
            tone === "primary" ? "text-primary" : tone === "tertiary" ? "text-tertiary" : "text-on-surface"
          }`}
        >
          {value}
        </strong>
        <span className="mt-1.5 block text-xs text-on-surface-variant">{hint}</span>
      </div>
      <div
        className={`grid size-10 shrink-0 place-items-center rounded-full ${
          tone === "primary" ? "bg-primary/15 text-primary" : tone === "tertiary" ? "bg-tertiary/15 text-tertiary" : "bg-surface-container-highest text-on-surface-variant"
        }`}
      >
        <Icon className="text-[20px]">{icon}</Icon>
      </div>
    </div>
  );
}

export function OverviewPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [runs, setRuns] = useState<PayrollRun[]>([]);

  useEffect(() => {
    Promise.all([api<Employee[]>("/employees"), api<Project[]>("/projects"), api<PayrollRun[]>("/payroll")])
      .then(([employeeRows, projectRows, runRows]) => {
        setEmployees(employeeRows);
        setProjects(projectRows);
        setRuns(runRows);
      })
      .catch(() => undefined);
  }, []);

  const activeEmployees = useMemo(() => employees.filter((employee) => employee.status === "ACTIVE").length, [employees]);
  const activeProjects = useMemo(() => projects.filter((project) => project.status === "IN_PROGRESS").length, [projects]);
  const latestRun = runs[0];
  const currency = latestRun?.payslips[0]?.currency ?? "PKR";
  const totals = useMemo(() => {
    const rows = latestRun?.payslips ?? [];
    return {
      net: rows.reduce((sum, row) => sum + row.netAmount, 0),
      paid: rows.reduce((sum, row) => sum + row.paidAmount, 0),
      pendingCount: rows.filter((row) => row.paymentStatus === "PENDING").length,
      paidCount: rows.filter((row) => row.paymentStatus === "PAID").length,
      partialCount: rows.filter((row) => row.paymentStatus === "PARTIALLY_PAID").length,
    };
  }, [latestRun]);
  const totalPayslips = latestRun?.payslips.length ?? 0;
  const paidPct = totalPayslips ? (totals.paidCount / totalPayslips) * 100 : 0;
  const partialPct = totalPayslips ? (totals.partialCount / totalPayslips) * 100 : 0;

  const recentProjects = projects.slice(0, 5);
  const recentEmployees = employees.slice(0, 5);

  return (
    <div className="mx-auto max-w-[1450px] px-6 py-7">
      <PageHeader
        className="mb-8 px-1"
        title="Overview"
        description="A snapshot of your people, projects, and payroll."
      />

      <div className="mb-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon="group" labelText="Employees" value={String(employees.length)} hint={`${activeEmployees} active`} />
        <StatCard icon="list_alt" labelText="Active projects" value={String(activeProjects)} hint={`${projects.length} total`} tone="primary" />
        <StatCard icon="payments" labelText="Net payable" value={formatMoney(totals.net, currency)} hint={latestRun ? latestRun.periodMonth : "No payroll yet"} tone="tertiary" />
        <StatCard icon="hourglass_top" labelText="Pending payslips" value={String(totals.pendingCount)} hint={`of ${totalPayslips} this run`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section className="surface-panel overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5">
            <SectionHeading>Active projects</SectionHeading>
            <Link to="/projects" className="text-xs font-medium text-primary hover:underline">View all</Link>
          </div>
          {recentProjects.length === 0 ? (
            <EmptyState>No projects yet.</EmptyState>
          ) : (
            <ul className="divide-y divide-outline-variant/30">
              {recentProjects.map((project) => (
                <li key={project.id} className="flex items-center justify-between gap-4 px-6 py-3.5">
                  <div className="min-w-0">
                    <strong className="block truncate text-sm font-medium text-on-surface">{project.name}</strong>
                    <span className="mt-0.5 block text-xs text-on-surface-variant">{project.clientName} · {formatDate(project.startDate)}</span>
                  </div>
                  <StatusChip value={project.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="surface-panel p-6">
          <SectionHeading accent="tertiary" className="mb-5">Payroll status</SectionHeading>
          <div className="flex h-1.5 overflow-hidden rounded-full bg-outline-variant">
            <span className="bg-primary" style={{ width: `${paidPct}%` }} />
            <span className="bg-tertiary" style={{ width: `${partialPct}%` }} />
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-on-surface-variant">
            <span className="flex items-center gap-2"><i className="size-2 rounded-full bg-primary" />{totals.paidCount} Paid</span>
            <span className="flex items-center gap-2"><i className="size-2 rounded-full bg-tertiary" />{totals.partialCount} Partial</span>
            <span className="flex items-center gap-2"><i className="size-2 rounded-full bg-outline-variant" />{totals.pendingCount} Pending</span>
          </div>

          <SectionHeading className="mb-4 mt-7">Recent employees</SectionHeading>
          {recentEmployees.length === 0 ? (
            <EmptyState>No employees yet.</EmptyState>
          ) : (
            <ul className="flex flex-col gap-3.5">
              {recentEmployees.map((employee, index) => (
                <li key={employee.id} className="flex items-center gap-3">
                  <Avatar src={avatars[index % avatars.length]} size="sm" />
                  <div className="min-w-0">
                    <span className="block truncate text-sm text-on-surface">{employee.fullName}</span>
                    <span className="block truncate text-xs text-on-surface-variant">{employee.designation?.name ?? "—"}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
