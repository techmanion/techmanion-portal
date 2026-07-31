import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Loading, Select, Textarea } from "../components/atoms";
import { FormField, FormSection } from "../components/molecules";
import { FormPage } from "../components/organisms";
import { ApiError, getOrganization, updateOrganization } from "../lib/api";
import { CURRENCIES, TIMEZONES } from "../lib/options";
import { useToast } from "../toast";
import type { OrganizationPayload } from "../types";

const emptyForm: OrganizationPayload = {
  name: "",
  legalName: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  defaultCurrency: "PKR",
  timezone: "UTC",
};

export function OrganizationFormPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState<OrganizationPayload>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getOrganization()
      .then((organization) => setForm({
        name: organization.name,
        legalName: organization.legalName ?? "",
        email: organization.email ?? "",
        phone: organization.phone ?? "",
        website: organization.website ?? "",
        address: organization.address ?? "",
        defaultCurrency: organization.defaultCurrency,
        timezone: organization.timezone,
      }))
      .catch((reason) => setError(reason instanceof ApiError ? reason.message : "Organization details could not be loaded."))
      .finally(() => setLoading(false));
  }, []);

  function set<K extends keyof OrganizationPayload>(key: K, value: OrganizationPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await updateOrganization(form);
      toast.success("Organization details updated.");
      navigate("/organization");
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Organization details could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="grid min-h-[70vh] place-items-center"><Loading /></div>;

  return (
    <FormPage
      breadcrumbTo="/organization"
      breadcrumbTrail={["Organization", "Edit"]}
      title="Edit organization"
      description="Update company, contact, and regional details."
      onSubmit={submit}
      submitLabel="Save changes"
      submitting={saving}
      cancelTo="/organization"
      error={error}
    >
      <FormSection heading="Company details" bordered={false}>
        <FormField label="Organization name"><Input value={form.name} onChange={(event) => set("name", event.target.value)} required maxLength={160} /></FormField>
        <FormField label="Legal name" hint="Optional. Used on official documents."><Input value={form.legalName ?? ""} onChange={(event) => set("legalName", event.target.value)} maxLength={160} /></FormField>
      </FormSection>
      <FormSection heading="Contact" accent="tertiary">
        <FormField label="Email"><Input type="email" value={form.email ?? ""} onChange={(event) => set("email", event.target.value)} required /></FormField>
        <FormField label="Phone" hint="Optional"><Input type="tel" value={form.phone ?? ""} onChange={(event) => set("phone", event.target.value)} maxLength={40} /></FormField>
        <FormField label="Website" hint="Optional"><Input type="url" value={form.website ?? ""} onChange={(event) => set("website", event.target.value)} placeholder="https://" maxLength={255} /></FormField>
        <FormField label="Address" hint="Optional" className="md:col-span-2"><Textarea value={form.address ?? ""} onChange={(event) => set("address", event.target.value)} /></FormField>
      </FormSection>
      <FormSection heading="Regional settings">
        <FormField label="Default currency"><Select value={form.defaultCurrency} onChange={(event) => set("defaultCurrency", event.target.value)} required>{CURRENCIES.map((code) => <option key={code} value={code}>{code}</option>)}</Select></FormField>
        <FormField label="Timezone"><Select value={form.timezone} onChange={(event) => set("timezone", event.target.value)} required>{TIMEZONES.map((zone) => <option key={zone} value={zone}>{zone}</option>)}</Select></FormField>
      </FormSection>
    </FormPage>
  );
}
