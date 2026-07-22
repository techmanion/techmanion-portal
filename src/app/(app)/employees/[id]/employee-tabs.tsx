"use client";

import type { ReactNode } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export function EmployeeTabs({
  profile,
  compensation,
  documents,
  payroll,
  projects,
}: {
  profile: ReactNode;
  compensation: ReactNode;
  documents: ReactNode;
  payroll: ReactNode;
  projects: ReactNode;
}) {
  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList>
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="compensation">Compensation</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
        <TabsTrigger value="payroll">Payroll history</TabsTrigger>
        <TabsTrigger value="projects">Projects</TabsTrigger>
      </TabsList>
      <TabsContent value="profile">{profile}</TabsContent>
      <TabsContent value="compensation">{compensation}</TabsContent>
      <TabsContent value="documents">{documents}</TabsContent>
      <TabsContent value="payroll">{payroll}</TabsContent>
      <TabsContent value="projects">{projects}</TabsContent>
    </Tabs>
  );
}
