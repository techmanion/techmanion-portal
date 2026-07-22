import { PageHeader } from "@/components/page-header";

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Projects" />
      <div className="rounded-lg border border-border bg-card p-8">
        <p className="text-sm text-muted-foreground">
          Projects and assignments will appear here.
        </p>
      </div>
    </div>
  );
}
