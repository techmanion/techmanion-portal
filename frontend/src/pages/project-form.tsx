import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FormPage, ProjectFormFields } from "../components/organisms";
import { createProject, getProject, updateProject } from "../lib/api/projects";
import { useToast } from "../toast";
import type { ProjectPayload } from "../types";

const emptyProject: ProjectPayload = {
  name: "",
  clientName: "",
  projectType: "FIXED",
  status: "PLANNED",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: null,
  notes: null,
  monthlyAmount: null,
  billingDay: null,
  autoRenew: null,
  contractValue: 0,
  hourlyRate: null,
  estimatedHours: null,
  loggedHours: null,
  milestones: [],
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
      getProject(projectId)
        .then((project) => {
          setForm({
            name: project.name,
            clientName: project.clientName,
            projectType: project.projectType,
            status: project.status,
            startDate: project.startDate.slice(0, 10),
            endDate: project.endDate?.slice(0, 10) ?? null,
            notes: project.notes,
            monthlyAmount: project.monthlyAmount,
            billingDay: project.billingDay,
            autoRenew: project.autoRenew,
            contractValue: project.contractValue,
            hourlyRate: project.hourlyRate,
            estimatedHours: project.estimatedHours,
            loggedHours: project.loggedHours,
            milestones: project.milestones.map((milestone) => ({
              name: milestone.name,
              amount: milestone.amount,
              dueDate: milestone.dueDate,
              status: milestone.status,
              paidDate: milestone.paidDate,
            })),
          });
        })
        .catch((reason: Error) => setError(reason.message));
    }
  }, [projectId]);

  const title = useMemo(() => (isEdit ? "Edit project" : "New project"), [isEdit]);
  const cancelTo = isEdit ? `/projects/${projectId}` : "/projects";

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      if (isEdit) {
        await updateProject(projectId!, form);
        toast.success("Project updated.");
        navigate(cancelTo);
      } else {
        const saved = await createProject(form);
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
      description="Client, billing, timeline, and status details."
      onSubmit={submit}
      submitLabel={isEdit ? "Save changes" : "Create project"}
      submitting={submitting}
      cancelTo={cancelTo}
      error={error}
    >
      <ProjectFormFields value={form} onChange={setForm} />
    </FormPage>
  );
}
