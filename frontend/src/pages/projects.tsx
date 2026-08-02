import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { Button, Icon, Loading } from "../components/atoms";
import { EmptyState, FilterSelect, SearchInput } from "../components/molecules";
import { FilterToolbar, PageHeader, ProjectsTable } from "../components/organisms";
import { useClearSearchParams, useSearchParamState } from "../hooks/useSearchParamState";
import { listProjects } from "../lib/api/projects";
import { label } from "../lib/format";
import { PROJECT_STATUSES } from "../lib/options";
import type { Project } from "../types";

export function ProjectsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useSearchParamState("search");
  const [status, setStatus] = useSearchParamState("status");
  const [client, setClient] = useSearchParamState("client");
  const clearSearchParams = useClearSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  function load() {
    listProjects()
      .then(setProjects)
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
    clearSearchParams(["search", "status", "client"]);
  }

  return (
    <div className="mx-auto max-w-[1450px] px-6 py-7">
      <PageHeader
        className="mb-8 px-1"
        title="Projects"
        description="Manage active and historical client projects."
        actions={
          user?.role === "EXECUTIVE" ? (
            <Link
              to="/projects/new"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-on-primary shadow-md shadow-black/10 hover:brightness-105"
            >
              <Icon className="text-[18px]">add</Icon>
              New project
            </Link>
          ) : undefined
        }
      />

      <section className="surface-panel overflow-hidden">
        <div className="bg-surface-container-high/30 px-6 py-4">
          <FilterToolbar>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search projects..."
              className="lg:max-w-[380px]"
            />
            <FilterSelect value={status} onChange={setStatus} labelText="Status" placeholder="Filter by status">
              {PROJECT_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {label(value)}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect value={client} onChange={setClient} labelText="Client" placeholder="Filter by client">
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
            onRowClick={(project) => navigate(`/projects/${project.id}`)}
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
