import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Icon, Loading } from "../components/atoms";
import { EmptyState, FilterSelect, SearchInput } from "../components/molecules";
import { EmployeeTable, FilterToolbar, PageHeader } from "../components/organisms";
import { api } from "../lib/api";
import { label } from "../lib/format";
import type { Employee, EmployeeStatus, NamedOption } from "../types";

export function EmployeesPage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [designations, setDesignations] = useState<NamedOption[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<EmployeeStatus | "">("");
  const [designation, setDesignation] = useState("");
  const [employeeType, setEmployeeType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status) params.set("status_filter", status);
      if (designation) params.set("designation_id", designation);
      setLoading(true);
      api<Employee[]>(`/employees?${params}`)
        .then(setEmployees)
        .catch((reason: Error) => setError(reason.message))
        .finally(() => setLoading(false));
    }, 180);
    return () => window.clearTimeout(timer);
  }, [search, status, designation]);

  useEffect(() => {
    api<NamedOption[]>("/settings/designations").then(setDesignations).catch(() => undefined);
  }, []);

  const visibleEmployees = useMemo(
    () => employees.filter((employee) => !employeeType || employee.employeeType === employeeType),
    [employees, employeeType],
  );

  const hasActiveFilters = Boolean(search || status || designation || employeeType);
  function clearFilters() {
    setSearch("");
    setStatus("");
    setDesignation("");
    setEmployeeType("");
  }

  return (
    <div className="mx-auto max-w-[1450px] px-6 py-7">
      <PageHeader
        className="mb-8 px-1"
        title="Employees"
        meta={
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            {employees.length.toLocaleString()} Total
          </span>
        }
        description="Manage your team and employment records from a centralized command center."
        actions={
          <Link
            to="/employees/new"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-on-primary shadow-md shadow-black/10 hover:brightness-105"
          >
            <Icon className="text-[18px]">add</Icon>
            Add employee
          </Link>
        }
      />

      <section className="surface-panel overflow-hidden">
        <div className="bg-surface-container-high/30 px-6 py-4">
          <FilterToolbar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search employees..." className="lg:max-w-[380px]" />
            <div className="mx-2 hidden h-8 w-px bg-outline-variant/50 xl:block" />
            <FilterSelect value={designation} onChange={setDesignation} labelText="Job Title">
              <option value="">Job Title</option>
              {designations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </FilterSelect>
            <FilterSelect value={employeeType} onChange={setEmployeeType} labelText="Employment type">
              <option value="">Employment Type</option>
              {["FULL_TIME", "PART_TIME", "CONTRACT"].map((value) => (
                <option key={value} value={value}>{label(value)}</option>
              ))}
            </FilterSelect>
            <FilterSelect value={status} onChange={(value) => setStatus(value as EmployeeStatus | "")} labelText="Status">
              <option value="">Status</option>
              {["ACTIVE", "ON_LEAVE", "RESIGNED", "TERMINATED"].map((value) => (
                <option key={value} value={value}>{label(value)}</option>
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

        {loading ? (
          <div className="grid min-h-40 place-items-center"><Loading /></div>
        ) : (
          <EmployeeTable employees={visibleEmployees} onRowClick={(employee) => navigate(`/employees/${employee.id}`)} />
        )}
        {!loading && !error && visibleEmployees.length === 0 && (
          <EmptyState>No employees match the selected filters.</EmptyState>
        )}
        {error && <EmptyState>{error}</EmptyState>}

        {!loading && <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-outline-variant/30 bg-surface-container-highest/20 px-6 py-3.5 text-sm text-on-surface-variant">
          <span>Showing {visibleEmployees.length} of {employees.length} employees</span>
        </footer>}
      </section>
    </div>
  );
}
