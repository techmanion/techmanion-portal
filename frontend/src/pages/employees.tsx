import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon, IconButton } from "../components/atoms";
import { EmptyState, FilterSelect, PaginationControls, SearchInput } from "../components/molecules";
import { EmployeeTable, FilterToolbar, PageHeader } from "../components/organisms";
import { api } from "../lib/api";
import { label } from "../lib/format";
import type { Employee, EmployeeStatus, NamedOption } from "../types";

const portraits = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAYo5IyKq4X8hfKEl_lkeW-e4U74MqO7VViu1lZQZnpmCvl2hw6iIqQOujI6lxBlLMLvShIJFap-cIWldvcvh0vuvecQLFajBM2vTH3uNSlcCc9ElT5ZdUXIPWWxUPQReCkAL1oNV6ZFctqgdwpPTDlSZuVjOE_rnENYw0NjZ9gbcHu6PIrhwDk1eJLJeyMeHGS1Be8IzuPyj1OW8g25gkrQYHPSHg0kKjY64ZoEHdM7MXmNBA_CcbfbERyHcZYSOOpF9ifdksLr3b5",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA5kkZZPNaNIENoWampmaw5bVKcAoszuU2mM9jTeelTnyh0JyOlPNed4z_8e71zgl6zk5w5zbMbQFZqX2cg3oLaC_TOS3USozLEff6eNucwUCXIVgiNxHGmapwbJGIpsVQzwpPqHH42smFmPEdX-bhFTluPvxhFpfb8ffrdmmcjXOInfE1oLR8GuIz_CTBJ5r9kWKzEe0Upzh9qMGYF2kHggSTXoMYhCs4ks_vaf3espYNyuutN1LPHK1uSwBVsFFh88ZjUT8lyVJvA",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCM-HRB1vIIG-UWgEuoyBr984uaTy_mokXHIQnvr2nR6yv6FTizlvF8tbhmUWoBdPnAv7kpf-F_73sFLHEgKvagMYEoAbfVC8lF3rVQXGbZ3oRRSjW3YLl5d_8n8_PCZc0pTP34n67e2F5g8LyqXeQgUmjQqcWJfvcgyM_LMZEkKmll1k3QnGzNCN544E5NuMGk0MtAb7_e9H2dc245yxj76kmpuEvpyuNNFONVnfHlo0-qdTCdulIQZg0RkDIZCgRdDwnIOLdXHBzB",
];

export function EmployeesPage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<NamedOption[]>([]);
  const [designations, setDesignations] = useState<NamedOption[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<EmployeeStatus | "">("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [employeeType, setEmployeeType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status) params.set("status_filter", status);
      if (department) params.set("department_id", department);
      if (designation) params.set("designation_id", designation);
      setLoading(true);
      api<Employee[]>(`/employees?${params}`)
        .then(setEmployees)
        .catch((reason: Error) => setError(reason.message))
        .finally(() => setLoading(false));
    }, 180);
    return () => window.clearTimeout(timer);
  }, [search, status, department, designation]);

  useEffect(() => {
    Promise.all([
      api<NamedOption[]>("/settings/departments"),
      api<NamedOption[]>("/settings/designations"),
    ])
      .then(([departmentRows, designationRows]) => {
        setDepartments(departmentRows);
        setDesignations(designationRows);
      })
      .catch(() => undefined);
  }, []);

  const visibleEmployees = useMemo(
    () => employees.filter((employee) => !employeeType || employee.employeeType === employeeType),
    [employees, employeeType],
  );

  return (
    <div className="min-h-[calc(100vh-64px)] p-3 lg:p-4">
      <section className="surface-panel mx-auto flex min-h-[calc(100vh-96px)] max-w-[1450px] flex-col overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-outline-variant/30 px-6 py-6">
          <PageHeader
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

          <FilterToolbar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search employees..." className="lg:max-w-[380px]" />
            <div className="mx-2 hidden h-8 w-px bg-outline-variant/50 xl:block" />
            <FilterSelect value={department} onChange={setDepartment} labelText="Department">
              <option value="">Department</option>
              {departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </FilterSelect>
            <FilterSelect value={designation} onChange={setDesignation} labelText="Designation">
              <option value="">Designation</option>
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
            <IconButton className="ml-auto" aria-label="Filter list">
              <Icon>filter_list</Icon>
            </IconButton>
            <IconButton aria-label="Grid view">
              <Icon>grid_view</Icon>
            </IconButton>
          </FilterToolbar>
        </div>

        <div className="flex-1 overflow-x-auto">
          <EmployeeTable employees={visibleEmployees} avatars={portraits} onRowClick={(employee) => navigate(`/employees/${employee.id}`)} />
          {!loading && !error && visibleEmployees.length === 0 && (
            <EmptyState>No employees match the selected filters.</EmptyState>
          )}
          {error && <EmptyState>{error}</EmptyState>}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-outline-variant/30 px-6 py-3.5 text-sm text-on-surface-variant">
          <div className="flex items-center gap-5">
            <span>Showing {visibleEmployees.length ? `1–${visibleEmployees.length}` : "0"} of {employees.length}</span>
            <span className="rounded-full bg-surface-container-low px-3 py-1.5 text-xs">Rows per page: <strong className="ml-1.5 text-on-surface">10⌄</strong></span>
          </div>
          <PaginationControls page={1} pageCount={3} />
        </footer>
      </section>
    </div>
  );
}
