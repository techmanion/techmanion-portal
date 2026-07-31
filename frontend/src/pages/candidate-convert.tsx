import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Input, Loading, Select } from "../components/atoms";
import { EmptyState, FormField, FormSection, MoneyInput } from "../components/molecules";
import { FormPage } from "../components/organisms";
import { convertCandidate, getCandidate } from "../lib/api/hiring";
import { listDesignations } from "../lib/api/settings";
import { label } from "../lib/format";
import { EMPLOYEE_TYPES } from "../lib/options";
import { useToast } from "../toast";
import type { Candidate, ConvertToEmployeePayload, NamedOption } from "../types";

const emptyForm: ConvertToEmployeePayload = {
  employeeType: "EMPLOYEE",
  joiningDate: new Date().toISOString().slice(0, 10),
  designationId: 0,
  baseAmount: 0,
  currency: "PKR",
};

export function CandidateConvertPage() {
  const { candidateId } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [designations, setDesignations] = useState<NamedOption[]>([]);
  const [form, setForm] = useState<ConvertToEmployeePayload>(emptyForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const cancelTo = `/hiring/candidates/${candidateId}`;

  useEffect(() => {
    Promise.all([getCandidate(candidateId!), listDesignations()])
      .then(([candidateRow, designationRows]) => {
        setCandidate(candidateRow);
        setDesignations(designationRows);
      })
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }, [candidateId]);

  function set<K extends keyof ConvertToEmployeePayload>(key: K, value: ConvertToEmployeePayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await convertCandidate(Number(candidateId), form);
      toast.success("Candidate converted to employee.");
      navigate(cancelTo);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Candidate could not be converted.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="grid min-h-[70vh] place-items-center"><Loading /></div>;
  if (!candidate) return <div className="p-6"><EmptyState>{error || "Candidate was not found."}</EmptyState></div>;

  return (
    <FormPage
      breadcrumbTo={cancelTo}
      breadcrumbTrail={["Hiring", "Convert to employee"]}
      title="Convert to employee"
      description={candidate ? `Set up ${candidate.fullName}'s employment record.` : "Set up the employment record."}
      onSubmit={submit}
      submitLabel="Convert to employee"
      submittingLabel="Converting…"
      submitting={submitting}
      cancelTo={cancelTo}
      error={error}
    >
      <FormSection heading="Employment details" bordered={false}>
        <FormField label="Employment type">
          <Select
            value={form.employeeType}
            onChange={(event) => set("employeeType", event.target.value as ConvertToEmployeePayload["employeeType"])}
          >
            {EMPLOYEE_TYPES.map((value) => (
              <option key={value} value={value}>
                {label(value)}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Joining date">
          <Input
            type="date"
            value={form.joiningDate}
            onChange={(event) => set("joiningDate", event.target.value)}
            required
          />
        </FormField>
        <FormField label="Designation">
          <Select
            value={form.designationId || ""}
            onChange={(event) => set("designationId", Number(event.target.value))}
            required
          >
            <option value="" disabled hidden>
              Select designation
            </option>
            {designations.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Monthly compensation">
          <MoneyInput value={form.baseAmount ?? 0} onChange={(value) => set("baseAmount", value)} required />
        </FormField>
        <FormField label="Currency">
          <Input
            value={form.currency}
            maxLength={3}
            onChange={(event) => set("currency", event.target.value.toUpperCase())}
            required
          />
        </FormField>
      </FormSection>
    </FormPage>
  );
}
