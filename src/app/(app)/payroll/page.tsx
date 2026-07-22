import { PageHeader } from "@/components/page-header";

export default function PayrollPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Payroll" />
      <div className="rounded-lg border border-border bg-card p-8">
        <p className="text-sm text-muted-foreground">
          Monthly payroll runs will appear here.
        </p>
      </div>
    </div>
  );
}
