import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth";
import { Button, Icon, Loading } from "../components/atoms";
import { EmptyState, FilterSelect, SearchInput } from "../components/molecules";
import { FilterToolbar, PageHeader, ProjectFormPanel, ProjectsTable } from "../components/organisms";
import { listEmployees } from "../lib/api/employees";
import { assignEmployeeToProject, createProject, listProjects } from "../lib/api/projects";
import { label } from "../lib/format";
import { PROJECT_STATUSES } from "../lib/options";
import type { Employee, Project, ProjectPayload } from "../types";

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
  const [form, setForm] = useState<ProjectPayload>({
    name: "",
    clientName: "",
    status: "PLANNED",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    notes: "",
  });

  function load() {
    Promise.all([listProjects(), listEmployees("")])
      .then(([projectRows, employeeRows]) => {
        setProjects(projectRows);
        setEmployees(employeeRows);
      })
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const clients = useMemo(
    () => Array.from(new Set(projects.map((project) => project.clientName))),
    [projects],
  );
  const visible = useMemo(
    () =>
      projects.filter(
        (project) =>
          (!search ||
            `${project.name} ${project.clientName}`.toLowerCase().includes(search.toLowerCase())) &&
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

  async function createProjectEntry(event: React.FormEvent) {
    event.preventDefault();
    try {
      await createProject({ ...form, endDate: form.endDate || undefined, notes: form.notes || undefined });
      setShowForm(false);
      setForm({ ...form, name: "", clientName: "", endDate: "", notes: "" });
      load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Project could not be created.");
    }
  }

  async function assign(projectId: number, employeeId: number) {
    try {
      await assignEmployeeToProject(projectId, employeeId);
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
        <ProjectFormPanel
          form={form}
          onChange={setForm}
          onSubmit={createProjectEntry}
          onCancel={() => setShowForm(false)}
        />
      )}

      <section className="surface-panel overflow-hidden">
        <div className="bg-surface-container-high/30 px-6 py-4">
          <FilterToolbar>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search projects..."
              className="lg:max-w-[380px]"
            />
            <FilterSelect value={status} onChange={setStatus} labelText="Status">
              <option value="">Status</option>
              {PROJECT_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {label(value)}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect value={client} onChange={setClient} labelText="Client">
              <option value="">Client</option>
              {clients.map((value) => (
                <option key={value}>{value}</option>
              ))}
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

        {loading && (
          <div className="grid min-h-40 place-items-center">
            <Loading />
          </div>
        )}
        {!loading && (
          <ProjectsTable
            projects={visible}
            employees={employees}
            isAdmin={user?.role === "ADMIN"}
            onRowClick={(project) => navigate(`/projects/${project.id}`)}
            onAssign={assign}
          />
        )}
        {!loading && !visible.length && <EmptyState>No projects match these filters.</EmptyState>}

        {!loading && (
          <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-outline-variant/30 bg-surface-container-highest/20 px-6 py-3.5 text-sm text-on-surface-variant">
            <span>Showing {visible.length} of {projects.length} projects</span>
          </footer>
        )}
      </section>
      {error && <div className="mt-5 rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div>}
    </div>
  );
}
