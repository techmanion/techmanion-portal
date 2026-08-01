import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Icon, Loading } from "../components/atoms";
import { EmptyState, FilterSelect, SearchInput } from "../components/molecules";
import { EmployeeTable, FilterToolbar, PageHeader } from "../components/organisms";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useClearSearchParams, useSearchParamState } from "../hooks/useSearchParamState";
import { listEmployees } from "../lib/api/employees";
import { listDesignations } from "../lib/api/settings";
import { label } from "../lib/format";
import { EMPLOYEE_STATUSES, EMPLOYEE_TYPES } from "../lib/options";
import type { Employee, EmployeeStatus, NamedOption } from "../types";

export function EmployeesPage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [designations, setDesignations] = useState<NamedOption[]>([]);
  const [search, setSearch] = useSearchParamState("search");
  const debouncedSearch = useDebouncedValue(search, 180);
  const [status, setStatus] = useSearchParamState("status");
  const [designation, setDesignation] = useSearchParamState("designation");
  const [employeeType, setEmployeeType] = useSearchParamState("type");
  const clearSearchParams = useClearSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    function load() {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (status) params.set("status_filter", status);
      if (designation) params.set("designation_id", designation);
      setLoading(true);
      listEmployees(params.toString())
        .then(setEmployees)
        .catch((reason: Error) => setError(reason.message))
        .finally(() => setLoading(false));
    }
    load();
  }, [debouncedSearch, status, designation]);

  useEffect(() => {
    listDesignations().then(setDesignations).catch(() => undefined);
  }, []);

  const visibleEmployees = useMemo(
    () => employees.filter((employee) => !employeeType || employee.employeeType === employeeType),
    [employees, employeeType],
  );

  const hasActiveFilters = Boolean(search || status || designation || employeeType);
  function clearFilters() {
    clearSearchParams(["search", "status", "designation", "type"]);
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
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search employees..."
              className="lg:max-w-[380px]"
            />
            <div className="mx-2 hidden h-8 w-px bg-outline-variant/50 xl:block" />
            <FilterSelect value={designation} onChange={setDesignation} labelText="Designation" placeholder="Filter by designation">
              {designations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect value={employeeType} onChange={setEmployeeType} labelText="Employment type" placeholder="Filter by employment type">
              {EMPLOYEE_TYPES.map((value) => (
                <option key={value} value={value}>
                  {label(value)}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect
              value={status}
              onChange={(value) => setStatus(value as EmployeeStatus | "")}
              labelText="Status"
              placeholder="Filter by status"
            >
              {EMPLOYEE_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {label(value)}
                </option>
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
          <div className="grid min-h-40 place-items-center">
            <Loading />
          </div>
        ) : (
          <EmployeeTable
            employees={visibleEmployees}
            onRowClick={(employee) => navigate(`/employees/${employee.id}`)}
          />
        )}
        {!loading && !error && visibleEmployees.length === 0 && (
          <EmptyState>No employees match the selected filters.</EmptyState>
        )}
        {error && <EmptyState>{error}</EmptyState>}

        {!loading && (
          <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-outline-variant/30 bg-surface-container-highest/20 px-6 py-3.5 text-sm text-on-surface-variant">
            <span>
              Showing {visibleEmployees.length} of {employees.length} employees
            </span>
          </footer>
        )}
      </section>
    </div>
  );
}
