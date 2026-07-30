import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Input, Select, Textarea } from "../components/atoms";
import { FormField, FormSection } from "../components/molecules";
import { FormPage } from "../components/organisms";
import { createProject, getProject, updateProject } from "../lib/api/projects";
import { label } from "../lib/format";
import { PROJECT_STATUSES } from "../lib/options";
import { useToast } from "../toast";
import type { ProjectPayload, ProjectStatus } from "../types";

const emptyProject: ProjectPayload = {
  name: "",
  clientName: "",
  status: "PLANNED",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: "",
  notes: "",
};

export function ProjectFormPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(projectId);
  const [form, setForm] = useState<ProjectPayload>(emptyProject);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (projectId) {
      getProject(projectId).then((project) => {
        setForm({
          name: project.name,
          clientName: project.clientName,
          status: project.status,
          startDate: project.startDate.slice(0, 10),
          endDate: project.endDate ? project.endDate.slice(0, 10) : "",
          notes: project.notes ?? "",
        });
      });
    }
  }, [projectId]);

  const title = useMemo(() => (isEdit ? "Edit project" : "New project"), [isEdit]);
  const cancelTo = isEdit ? `/projects/${projectId}` : "/projects";

  function set<K extends keyof ProjectPayload>(key: K, value: ProjectPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const payload = { ...form, endDate: form.endDate || undefined, notes: form.notes || undefined };
      if (isEdit) {
        await updateProject(projectId!, payload);
        toast.success("Project updated.");
        navigate(cancelTo);
      } else {
        const saved = await createProject(payload);
        toast.success("Project created.");
        navigate(`/projects/${saved.id}`);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Project could not be saved.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormPage
      breadcrumbTo={cancelTo}
      breadcrumbTrail={isEdit ? ["Projects", form.name || "Project", "Edit"] : ["Projects", "New project"]}
      title={title}
      description="Client, timeline, and status details."
      onSubmit={submit}
      submitLabel={isEdit ? "Save changes" : "Create project"}
      submitting={submitting}
      cancelTo={cancelTo}
      error={error}
    >
      <FormSection heading="Project details" bordered={false}>
        <FormField label="Project name">
          <Input value={form.name} onChange={(event) => set("name", event.target.value)} required />
        </FormField>
        <FormField label="Client">
          <Input value={form.clientName} onChange={(event) => set("clientName", event.target.value)} required />
        </FormField>
        <FormField label="Status">
          <Select value={form.status} onChange={(event) => set("status", event.target.value as ProjectStatus)}>
            {PROJECT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {label(value)}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Start date">
          <Input
            type="date"
            value={form.startDate}
            onChange={(event) => set("startDate", event.target.value)}
            required
          />
        </FormField>
        <FormField label="Target end date">
          <Input
            type="date"
            value={form.endDate ?? ""}
            onChange={(event) => set("endDate", event.target.value)}
          />
        </FormField>
      </FormSection>

      <FormSection heading="Notes" accent="tertiary">
        <FormField label="Notes" className="md:col-span-2">
          <Textarea value={form.notes ?? ""} onChange={(event) => set("notes", event.target.value)} />
        </FormField>
      </FormSection>
    </FormPage>
  );
}
