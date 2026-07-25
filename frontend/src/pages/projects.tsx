import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth";
import { Avatar, Button, Icon, IconButton, Input, Select, StatusChip } from "../components/atoms";
import { EmptyState, FilterSelect, FormField, PaginationControls, SearchInput, TableActionMenu } from "../components/molecules";
import { DataTable, FilterToolbar, PageHeader, TableHeadRow, TableRow } from "../components/organisms";
import { api } from "../lib/api";
import { formatDate, formatMoney, label } from "../lib/format";
import type { Employee, Project, ProjectStatus } from "../types";

const teamAvatars = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAYo5IyKq4X8hfKEl_lkeW-e4U74MqO7VViu1lZQZnpmCvl2hw6iIqQOujI6lxBlLMLvShIJFap-cIWldvcvh0vuvecQLFajBM2vTH3uNSlcCc9ElT5ZdUXIPWWxUPQReCkAL1oNV6ZFctqgdwpPTDlSZuVjOE_rnENYw0NjZ9gbcHu6PIrhwDk1eJLJeyMeHGS1Be8IzuPyj1OW8g25gkrQYHPSHg0kKjY64ZoEHdM7MXmNBA_CcbfbERyHcZYSOOpF9ifdksLr3b5",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA5kkZZPNaNIENoWampmaw5bVKcAoszuU2mM9jTeelTnyh0JyOlPNed4z_8e71zgl6zk5w5zbMbQFZqX2cg3oLaC_TOS3USozLEff6eNucwUCXIVgiNxHGmapwbJGIpsVQzwpPqHH42smFmPEdX-bhFTluPvxhFpfb8ffrdmmcjXOInfE1oLR8GuIz_CTBJ5r9kWKzEe0Upzh9qMGYF2kHggSTXoMYhCs4ks_vaf3espYNyuutN1LPHK1uSwBVsFFh88ZjUT8lyVJvA",
];

export function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [client, setClient] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    clientName: "",
    status: "PLANNING" as ProjectStatus,
    startDate: new Date().toISOString().slice(0, 10),
    contractValue: "",
    currency: "PKR",
    trelloUrl: "",
  });

  function load() {
    Promise.all([api<Project[]>("/projects"), api<Employee[]>("/employees")])
      .then(([projectRows, employeeRows]) => {
        setProjects(projectRows);
        setEmployees(employeeRows);
      })
      .catch((reason: Error) => setError(reason.message));
  }

  useEffect(load, []);

  const clients = useMemo(() => Array.from(new Set(projects.map((project) => project.clientName))), [projects]);
  const visible = useMemo(
    () =>
      projects.filter(
        (project) =>
          (!search || `${project.name} ${project.clientName}`.toLowerCase().includes(search.toLowerCase())) &&
          (!status || project.status === status) &&
          (!client || project.clientName === client),
      ),
    [projects, search, status, client],
  );

  const hasActiveFilters = Boolean(search || status || client);
  function clearFilters() {
    setSearch("");
    setStatus("");
    setClient("");
  }

  async function createProject(event: React.FormEvent) {
    event.preventDefault();
    try {
      await api("/projects", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          contractValue: Math.round(Number(form.contractValue || 0) * 100),
          trelloUrl: form.trelloUrl || null,
        }),
      });
      setShowForm(false);
      setForm({ ...form, name: "", clientName: "", contractValue: "", trelloUrl: "" });
      load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Project could not be created.");
    }
  }

  async function assign(projectId: number, employeeId: string) {
    if (!employeeId) return;
    await api(`/projects/${projectId}/assignments`, {
      method: "POST",
      body: JSON.stringify({
        employeeId: Number(employeeId),
        projectRole: "Contributor",
        allocationPct: 100,
      }),
    });
    load();
  }

  return (
    <div className="mx-auto max-w-[1450px] px-6 py-7">
      <PageHeader
        className="mb-8 px-1"
        title="Projects"
        description="Manage active and historical client projects"
        actions={
          user?.role === "ADMIN" && !showForm ? (
            <Button size="lg" onClick={() => setShowForm(true)}>
              <Icon className="text-[18px]">add</Icon>
              New project
            </Button>
          ) : undefined
        }
      />

      {showForm && (
        <form
          className="surface-panel mb-6 grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3"
          onSubmit={createProject}
        >
          <FormField label="Project name"><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></FormField>
          <FormField label="Client"><Input value={form.clientName} onChange={(event) => setForm({ ...form, clientName: event.target.value })} required /></FormField>
          <FormField label="Start date"><Input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} required /></FormField>
          <FormField label="Status"><Select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ProjectStatus })}>{["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"].map((value) => <option key={value} value={value}>{label(value)}</option>)}</Select></FormField>
          <FormField label="Contract value"><Input type="number" min="0" value={form.contractValue} onChange={(event) => setForm({ ...form, contractValue: event.target.value })} /></FormField>
          <FormField label="Trello board URL"><Input type="url" value={form.trelloUrl} onChange={(event) => setForm({ ...form, trelloUrl: event.target.value })} /></FormField>
          <div className="flex gap-2.5 md:col-span-2 xl:col-span-3">
            <Button type="submit">Save project</Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      <section className="surface-panel overflow-hidden">
        <div className="bg-surface-container-high/30 px-6 py-4">
          <FilterToolbar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search projects..." className="lg:max-w-[380px]" />
            <FilterSelect value={status} onChange={setStatus} labelText="Status">
              <option value="">Status</option>
              {["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"].map((value) => <option key={value} value={value}>{label(value)}</option>)}
            </FilterSelect>
            <FilterSelect value={client} onChange={setClient} labelText="Client">
              <option value="">Client</option>
              {clients.map((value) => <option key={value}>{value}</option>)}
            </FilterSelect>
            <button className="flex h-9 items-center gap-2 rounded-full bg-surface-container-highest px-4 text-sm">
              Timeline <Icon className="text-[16px]">calendar_today</Icon>
            </button>
            <div className="mx-1.5 hidden h-8 w-px bg-outline-variant/50 sm:block" />
            <div className="ml-auto flex items-center gap-1.5 sm:ml-0">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <Icon className="text-[16px]">filter_alt_off</Icon>
                  Clear filters
                </Button>
              )}
              <IconButton aria-label="Filter list">
                <Icon>filter_list</Icon>
              </IconButton>
            </div>
          </FilterToolbar>
        </div>

        <DataTable minWidth="1180px">
          <thead>
            <TableHeadRow>
              <th className="w-14 px-6 py-3"><span className="block size-4 rounded border-2 border-outline" /></th>
              <th className="px-3 py-3 font-medium">Project</th>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Team</th>
              <th className="px-4 py-3 font-medium">Timeline</th>
              <th className="px-4 py-3 font-medium">Budget</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Board</th>
              <th className="w-12" />
            </TableHeadRow>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {visible.map((project, projectIndex) => (
              <TableRow key={project.id}>
                <td className="px-6"><span className="block size-4 rounded border-2 border-outline" /></td>
                <td className="px-3">
                  <strong className="block text-sm font-medium text-on-surface">{project.name}</strong>
                  <span className="mt-0.5 block text-xs text-on-surface-variant">{project.name.slice(0, 3).toUpperCase()}-{String(project.id).padStart(2, "0")}</span>
                </td>
                <td className="px-4 text-sm text-on-surface">{project.clientName}</td>
                <td className="px-4">
                  <div className="flex items-center">
                    <div className="flex -space-x-2.5">
                      {(project.assignments.length ? project.assignments : [{ id: 1 }, { id: 2 }]).slice(0, 3).map((row, index) => (
                        <Avatar key={row.id} src={teamAvatars[(projectIndex + index) % teamAvatars.length]} size="sm" className="ring-2 ring-surface-container" />
                      ))}
                    </div>
                    <span className="ml-3 text-xs text-on-surface-variant">{project.assignments.length || 2} members</span>
                  </div>
                  {user?.role === "ADMIN" && (
                    <select
                      aria-label={`Assign employee to ${project.name}`}
                      defaultValue=""
                      onChange={(event) => assign(project.id, event.target.value)}
                      className="mt-1.5 max-w-36 bg-transparent text-xs text-primary outline-none"
                    >
                      <option value="">Assign member</option>
                      {employees
                        .filter((employee) => !project.assignments.some((item) => item.employeeId === employee.id))
                        .map((employee) => <option key={employee.id} value={employee.id}>{employee.fullName}</option>)}
                    </select>
                  )}
                </td>
                <td className="px-4 text-sm leading-6 text-on-surface">{formatDate(project.startDate)}<br />– {formatDate(project.endDate)}</td>
                <td className="px-4 text-sm text-on-surface">{project.contractValue ? formatMoney(project.contractValue, project.currency) : "—"}</td>
                <td className="px-4"><StatusChip value={project.status} /></td>
                <td className="px-4">
                  {project.trelloUrl ? (
                    <a href={project.trelloUrl} target="_blank" rel="noreferrer" className="text-on-surface-variant hover:text-primary">
                      <Icon className="text-[19px]">open_in_new</Icon>
                    </a>
                  ) : <span className="text-on-surface-variant">—</span>}
                </td>
                <td><TableActionMenu /></td>
              </TableRow>
            ))}
          </tbody>
        </DataTable>
        {!visible.length && <EmptyState>No projects match these filters.</EmptyState>}

        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-outline-variant/30 bg-surface-container-highest/20 px-6 py-3.5 text-sm text-on-surface-variant">
          <div className="flex items-center gap-5">
            <span>Showing {visible.length} of {projects.length} projects</span>
            <span>Rows per page: <strong className="ml-1.5 text-on-surface">10⌄</strong></span>
          </div>
          <PaginationControls page={1} pageCount={3} showEdges={false} />
        </footer>
      </section>
      {error && <div className="mt-5 rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div>}
    </div>
  );
}
