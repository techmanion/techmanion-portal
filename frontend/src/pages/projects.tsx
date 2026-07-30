import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth";
import { Avatar, Button, Icon, Input, Loading, Select, StatusChip, Textarea } from "../components/atoms";
import { EmptyState, FilterSelect, FormField, SearchInput, TableActionMenu } from "../components/molecules";
import { DataTable, FilterToolbar, PageHeader, TableHeadRow, TableRow } from "../components/organisms";
import { api } from "../lib/api";
import { formatDate, label } from "../lib/format";
import type { Employee, Project, ProjectStatus } from "../types";

export function ProjectsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showForm, setShowForm] = useState(
    user?.role === "ADMIN" && searchParams.get("action") === "add-project",
  );
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [client, setClient] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    clientName: "",
    status: "PLANNED" as ProjectStatus,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    notes: "",
  });

  function load() {
    Promise.all([api<Project[]>("/projects"), api<Employee[]>("/employees")])
      .then(([projectRows, employeeRows]) => {
        setProjects(projectRows);
        setEmployees(employeeRows);
      })
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
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
        body: JSON.stringify({ ...form, endDate: form.endDate || null, notes: form.notes || null }),
      });
      setShowForm(false);
      setForm({ ...form, name: "", clientName: "", endDate: "", notes: "" });
      load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Project could not be created.");
    }
  }

  async function assign(projectId: number, employeeId: string) {
    if (!employeeId) return;
    try {
      await api(`/projects/${projectId}/assignments`, {
        method: "POST",
        body: JSON.stringify({ employeeId: Number(employeeId) }),
      });
      load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Employee could not be assigned.");
    }
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
          <FormField label="Status"><Select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ProjectStatus })}>{["PLANNED", "ACTIVE", "ON_HOLD", "COMPLETED"].map((value) => <option key={value} value={value}>{label(value)}</option>)}</Select></FormField>
          <FormField label="Start date"><Input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} required /></FormField>
          <FormField label="Target end date"><Input type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} /></FormField>
          <FormField label="Notes" className="md:col-span-2 xl:col-span-3"><Textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></FormField>
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
              {["PLANNED", "ACTIVE", "ON_HOLD", "COMPLETED"].map((value) => <option key={value} value={value}>{label(value)}</option>)}
            </FilterSelect>
            <FilterSelect value={client} onChange={setClient} labelText="Client">
              <option value="">Client</option>
              {clients.map((value) => <option key={value}>{value}</option>)}
            </FilterSelect>
            <div className="ml-auto flex items-center gap-1.5">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <Icon className="text-[16px]">filter_alt_off</Icon>
                  Clear filters
                </Button>
              )}
            </div>
          </FilterToolbar>
        </div>

        {loading && <div className="grid min-h-40 place-items-center"><Loading /></div>}
        {!loading && <DataTable minWidth="980px">
          <thead>
            <TableHeadRow>
              <th className="px-6 py-3 font-medium">Project</th>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Team</th>
              <th className="px-4 py-3 font-medium">Timeline</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="w-12" />
            </TableHeadRow>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {visible.map((project) => (
              <TableRow key={project.id} onClick={() => navigate(`/projects/${project.id}`)}>
                <td className="px-6">
                  <strong className="block text-sm font-medium text-on-surface">{project.name}</strong>
                </td>
                <td className="px-4 text-sm text-on-surface">{project.clientName}</td>
                <td className="px-4">
                  <div className="flex items-center">
                    <div className="flex -space-x-2.5">
                      {project.assignments.slice(0, 3).map((row) => (
                        <Avatar key={row.id} alt={row.employeeName} size="sm" ring className="ring-2 ring-surface-container" />
                      ))}
                    </div>
                    <span className="ml-3 text-xs text-on-surface-variant">{project.assignments.length} members</span>
                  </div>
                  {user?.role === "ADMIN" && (
                    <select
                      aria-label={`Assign employee to ${project.name}`}
                      defaultValue=""
                      onClick={(event) => event.stopPropagation()}
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
                <td className="px-4"><StatusChip value={project.status} /></td>
                <td><TableActionMenu onClick={() => navigate(`/projects/${project.id}`)} /></td>
              </TableRow>
            ))}
          </tbody>
        </DataTable>}
        {!loading && !visible.length && <EmptyState>No projects match these filters.</EmptyState>}

        {!loading && <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-outline-variant/30 bg-surface-container-highest/20 px-6 py-3.5 text-sm text-on-surface-variant">
          <span>Showing {visible.length} of {projects.length} projects</span>
        </footer>}
      </section>
      {error && <div className="mt-5 rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div>}
    </div>
  );
}
