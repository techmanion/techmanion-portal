import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

// v1 home is the employee directory (decisions.md D6). The table lands in the
// next slice; for now this is the standard page shell + empty state.
export default function EmployeesHomePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Employees" action={<Button disabled>Add employee</Button>} />
      <div className="rounded-lg border border-border bg-card p-8">
        <p className="text-sm text-muted-foreground">
          The employee directory will appear here.
        </p>
      </div>
    </div>
  );
}
