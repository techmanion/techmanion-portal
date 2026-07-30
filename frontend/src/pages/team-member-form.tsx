import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Select } from "../components/atoms";
import { FormField, FormSection } from "../components/molecules";
import { FormPage } from "../components/organisms";
import { ApiError } from "../lib/api";
import { createUser } from "../lib/api/users";
import { roleLabel } from "../lib/format";
import { USER_ROLES } from "../lib/options";
import { useToast } from "../toast";
import type { UserRole } from "../types";

const cancelTo = "/team";

export function TeamMemberFormPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "HR" as UserRole });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await createUser(form);
      toast.success("Team member created.");
      navigate(cancelTo);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Team member could not be created.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormPage
      breadcrumbTo={cancelTo}
      breadcrumbTrail={["Team Members", "Add member"]}
      title="Add member"
      description="Create a portal login account for admin or HR staff."
      onSubmit={submit}
      submitLabel="Create account"
      submittingLabel="Creating…"
      submitting={submitting}
      cancelTo={cancelTo}
      error={error}
    >
      <FormSection heading="Account details" bordered={false}>
        <FormField label="Full name">
          <Input value={form.name} onChange={(event) => set("name", event.target.value)} required />
        </FormField>
        <FormField label="Work email">
          <Input
            type="email"
            value={form.email}
            onChange={(event) => set("email", event.target.value)}
            required
          />
        </FormField>
        <FormField label="Temporary password" hint="At least 8 characters.">
          <Input
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(event) => set("password", event.target.value)}
            minLength={8}
            required
          />
        </FormField>
        <FormField label="Role">
          <Select value={form.role} onChange={(event) => set("role", event.target.value as UserRole)}>
            {USER_ROLES.map((role) => (
              <option key={role} value={role}>
                {roleLabel(role)}
              </option>
            ))}
          </Select>
        </FormField>
      </FormSection>
    </FormPage>
  );
}
