import { ExternalLink, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Card, EmptyState, Field, Input, PageHeader, Select, StatusChip } from "../components/ui";
import { useAuth } from "../auth";
import { api } from "../lib/api";
import { formatDate, formatMoney, label } from "../lib/format";
import type { Employee, Project, ProjectStatus } from "../types";

export function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", clientName: "", status: "PLANNING" as ProjectStatus,
    startDate: new Date().toISOString().slice(0, 10), contractValue: "", currency: "PKR", trelloUrl: "",
  });

  function load() {
    Promise.all([api<Project[]>("/projects"), api<Employee[]>("/employees")])
      .then(([projectRows, employeeRows]) => { setProjects(projectRows); setEmployees(employeeRows); })
      .catch((reason: Error) => setError(reason.message));
  }
  useEffect(load, []);

  async function createProject(event: React.FormEvent) {
    event.preventDefault();
    try {
      await api("/projects", {
        method: "POST",
        body: JSON.stringify({ ...form, contractValue: Math.round(Number(form.contractValue || 0) * 100), trelloUrl: form.trelloUrl || null }),
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
      body: JSON.stringify({ employeeId: Number(employeeId), projectRole: "Contributor", allocationPct: 100 }),
    });
    load();
  }

  return (
    <>
      <PageHeader
        title="Projects"
        description="Client work, Trello references, and team allocation."
        action={user?.role === "ADMIN" && !showForm ? <Button onClick={() => setShowForm(true)}><Plus size={18} /> Add project</Button> : undefined}
      />
      {showForm && (
        <Card>
          <form className="inline-form-grid" onSubmit={createProject}>
            <Field label="Project name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
            <Field label="Client"><Input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} required /></Field>
            <Field label="Start date"><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required /></Field>
            <Field label="Status"><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}>{["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"].map((value) => <option key={value} value={value}>{label(value)}</option>)}</Select></Field>
            <Field label="Contract value"><Input type="number" min="0" value={form.contractValue} onChange={(e) => setForm({ ...form, contractValue: e.target.value })} /></Field>
            <Field label="Trello board URL"><Input type="url" value={form.trelloUrl} onChange={(e) => setForm({ ...form, trelloUrl: e.target.value })} /></Field>
            <div className="form-actions"><Button type="submit">Save project</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button></div>
          </form>
        </Card>
      )}
      <Card>
        {projects.length === 0 ? <EmptyState>No projects yet.</EmptyState> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Project</th><th>Client</th><th>Status</th><th>Timeline</th><th className="numeric">Value</th><th>Team</th></tr></thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td><strong>{project.name}</strong>{project.trelloUrl && <a className="cell-link" href={project.trelloUrl} target="_blank" rel="noreferrer">Trello <ExternalLink size={13} /></a>}</td>
                    <td>{project.clientName}</td>
                    <td><StatusChip value={project.status} /></td>
                    <td>{formatDate(project.startDate)} – {formatDate(project.endDate)}</td>
                    <td className="numeric">{formatMoney(project.contractValue, project.currency)}</td>
                    <td>
                      <span className="cell-caption">{project.assignments.map((row) => row.employeeName).join(", ") || "Unassigned"}</span>
                      {user?.role === "ADMIN" && <Select aria-label={`Assign employee to ${project.name}`} defaultValue="" onChange={(e) => assign(project.id, e.target.value)}><option value="">Assign…</option>{employees.filter((employee) => !project.assignments.some((item) => item.employeeId === employee.id)).map((employee) => <option key={employee.id} value={employee.id}>{employee.fullName}</option>)}</Select>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {error && <div className="form-error page-error">{error}</div>}
    </>
  );
}
