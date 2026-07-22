import { requireAdmin } from "@/lib/auth/guards";
import { PageHeader } from "@/components/page-header";

export default async function SettingsPage() {
  // Settings (users, tax slabs, company profile) is Admin-only.
  await requireAdmin();
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" />
      <div className="rounded-lg border border-border bg-card p-8">
        <p className="text-sm text-muted-foreground">
          Departments, designations, tax slabs, and company profile will appear
          here.
        </p>
      </div>
    </div>
  );
}
