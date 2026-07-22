"use client";

import { useTransition } from "react";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { setEmployeeStatus } from "@/app/(app)/employees/actions";
import { EMPLOYEE_STATUSES, EMPLOYEE_STATUS_LABELS } from "@/lib/labels";
import type { EmployeeStatus } from "@/generated/prisma/enums";

export function StatusMenu({
  id,
  current,
}: {
  id: string;
  current: EmployeeStatus;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={pending}
        className={cn(buttonVariants({ variant: "outline" }))}
      >
        Change status
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {EMPLOYEE_STATUSES.map((s) => (
          <DropdownMenuItem
            key={s}
            disabled={s === current}
            onSelect={() =>
              startTransition(() => setEmployeeStatus(id, s as EmployeeStatus))
            }
          >
            {EMPLOYEE_STATUS_LABELS[s]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
