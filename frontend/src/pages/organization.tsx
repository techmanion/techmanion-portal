import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Icon, Loading } from "../components/atoms";
import { SectionHeading } from "../components/atoms/Typography";
import { PageHeader } from "../components/organisms";
import { ApiError, getOrganization } from "../lib/api";
import type { Organization } from "../types";

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">{label}</dt>
      <dd className="mt-1.5 whitespace-pre-wrap text-sm text-on-surface">{value || "—"}</dd>
    </div>
  );
}

export function OrganizationPage() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getOrganization()
      .then(setOrganization)
      .catch((reason) => setError(reason instanceof ApiError ? reason.message : "Organization details could not be loaded."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-[1000px] px-6 py-8">
      <PageHeader
        className="mb-8 px-1"
        title="Organization"
        description="Manage the company profile used across the portal."
        actions={organization ? (
          <Link to="/organization/edit" className="inline-flex h-10 items-center gap-2 rounded-full bg-surface-container-highest px-5 text-sm font-medium text-on-surface ring-1 ring-outline-variant/40 hover:bg-surface-bright">
            <Icon className="text-[16px]">edit</Icon>Edit
          </Link>
        ) : undefined}
      />

      {loading ? (
        <div className="grid min-h-40 place-items-center"><Loading /></div>
      ) : error || !organization ? (
        <div className="rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error || "Organization details could not be loaded."}</div>
      ) : (
        <section className="surface-panel p-6">
          <div className="pb-7">
            <SectionHeading>Company details</SectionHeading>
            <dl className="mt-5 grid gap-6 md:grid-cols-2">
              <Detail label="Organization name" value={organization.name} />
              <Detail label="Legal name" value={organization.legalName} />
            </dl>
          </div>
          <div className="border-t border-outline-variant/30 py-7">
            <SectionHeading accent="tertiary">Contact</SectionHeading>
            <dl className="mt-5 grid gap-6 md:grid-cols-2">
              <Detail label="Email" value={organization.email} />
              <Detail label="Phone" value={organization.phone} />
              <Detail label="Website" value={organization.website} />
              <Detail label="Address" value={organization.address} />
            </dl>
          </div>
          <div className="border-t border-outline-variant/30 pt-7">
            <SectionHeading>Regional settings</SectionHeading>
            <dl className="mt-5 grid gap-6 md:grid-cols-2">
              <Detail label="Default currency" value={organization.defaultCurrency} />
              <Detail label="Timezone" value={organization.timezone} />
            </dl>
          </div>
        </section>
      )}
    </div>
  );
}
