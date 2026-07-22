"use client";

import { useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EMPLOYEE_STATUSES, EMPLOYEE_STATUS_LABELS } from "@/lib/labels";

const ALL = "all";

export function EmployeeFilters({
  departments,
}: {
  departments: { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== ALL) params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        placeholder="Search name or CNIC"
        defaultValue={searchParams.get("q") ?? ""}
        className="h-9 w-64"
        onChange={(e) => {
          const value = e.target.value;
          if (debounce.current) clearTimeout(debounce.current);
          debounce.current = setTimeout(() => setParam("q", value), 300);
        }}
      />

      <Select
        defaultValue={searchParams.get("department") ?? ALL}
        onValueChange={(v) => setParam("department", v)}
      >
        <SelectTrigger className="h-9 w-48">
          <SelectValue placeholder="All departments" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All departments</SelectItem>
          {departments.map((d) => (
            <SelectItem key={d.id} value={d.id}>
              {d.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        defaultValue={searchParams.get("status") ?? ALL}
        onValueChange={(v) => setParam("status", v)}
      >
        <SelectTrigger className="h-9 w-40">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All statuses</SelectItem>
          {EMPLOYEE_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {EMPLOYEE_STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
