import { Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Card, EmptyState, PageHeader, Select, StatusChip } from "../components/ui";
import { api } from "../lib/api";
import { formatDate, label } from "../lib/format";
import { Link, useNavigate } from "../router";
import type { Employee, EmployeeStatus, NamedOption } from "../types";

export function EmployeesPage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<NamedOption[]>([]);
  const [designations, setDesignations] = useState<NamedOption[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<EmployeeStatus | "">("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
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
    ]).then(([departmentRows, designationRows]) => {
      setDepartments(departmentRows);
      setDesignations(designationRows);
    }).catch(() => undefined);
  }, []);

  return (
    <>
      <PageHeader
        title="Employees"
        description="People records, employment details, and compensation."
        action={
          <Link to="/employees/new" className="button button-primary">
            <Plus size={18} /> Add employee
          </Link>
        }
      />
      <div className="filters">
        <label className="search-input">
          <Search size={18} />
          <input
            placeholder="Search name, email, or CNIC"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <Select value={status} onChange={(event) => setStatus(event.target.value as EmployeeStatus | "")}>
          <option value="">All statuses</option>
          {["ACTIVE", "ON_LEAVE", "RESIGNED", "TERMINATED"].map((value) => (
            <option key={value} value={value}>{label(value)}</option>
          ))}
        </Select>
        <Select value={department} onChange={(event) => setDepartment(event.target.value)}>
          <option value="">All departments</option>
          {departments.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </Select>
        <Select value={designation} onChange={(event) => setDesignation(event.target.value)}>
          <option value="">All roles</option>
          {designations.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </Select>
      </div>
      <Card>
        {error ? (
          <EmptyState>{error}</EmptyState>
        ) : !loading && employees.length === 0 ? (
          <EmptyState>
            No employees match these filters. <Button variant="text" onClick={() => navigate("/employees/new")}>Add one</Button>
          </EmptyState>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id} onClick={() => navigate(`/employees/${employee.id}`)}>
                    <td>
                      <strong>{employee.fullName}</strong>
                      <span className="cell-caption">{employee.email}</span>
                    </td>
                    <td>{employee.designation?.name ?? "—"}</td>
                    <td>{employee.department?.name ?? "—"}</td>
                    <td>{label(employee.employeeType)}</td>
                    <td><StatusChip value={employee.status} /></td>
                    <td>{formatDate(employee.joiningDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {loading && <div className="table-loading">Loading employees…</div>}
          </div>
        )}
      </Card>
    </>
  );
}
