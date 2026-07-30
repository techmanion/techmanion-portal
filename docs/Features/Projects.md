---
tags: [feature]
---

# Feature: Projects

Routes `/projects`, `/projects/:id`. Components `projects.tsx`, `project-detail.tsx`. Backed
by [[Database/Projects|Database: Projects]] and the `/projects/*` endpoints in
[[Backend/API|Backend API]].

This module was **simplified** from a richer original design — see [[Phase 1]] for exactly
what was removed and why.

## List (`/projects`)

- Search (name/client), status filter, client filter (derived client-side from the loaded
  list).
- Table columns: project, client, team (avatar stack + member count + inline "assign member"
  `<select>` for admins), timeline (start – target end date), status.
- Clicking a row (or its action menu) opens the project's detail page.
- **Admin-only** "New project" button opens an inline create form directly on the list page:
  name, client, status, start date, target end date, notes.

## Detail / edit (`/projects/:id`)

- Read view: start date, target end date, notes (if any), status chip.
- **Admin-only** "Edit" toggles an inline form for every `Project` field (name, client,
  status, start date, target end date, notes) → `PUT /projects/{id}`.
- **Admin-only** "Delete" removes the project (cascades to its team assignments) after a
  confirm dialog.
- **Team Members** section: lists everyone assigned via `ProjectAssignment`, each with a
  remove (`×`) button (admin-only); an admin-only `<select>` assigns any employee not already
  on the project.

## Roles

Any logged-in user can **view** the project list and detail pages. Only **Admin** accounts can
create, edit, delete a project, or assign/remove team members
(`AdminUser`-guarded endpoints — see [[Backend/Authentication|Backend Authentication]]). HR/
Manager/Employee accounts see the assign controls hidden entirely (not just disabled).

## Fields intentionally removed in the current implementation

Compared to the original plan ([[data-model]], [[planning-doc]]), the following do **not**
exist in the shipped Projects module and there is no UI for them:

- Contract value / budget, currency per project
- Trello board URL (reference link)
- Per-assignment project role (e.g. "Lead Dev") and allocation percentage
- Per-assignment start/end dates

See [[Phase 1]] for the rationale.

## Planned / not implemented

- No project ↔ payroll linkage (payroll has no concept of which project an employee's time
  belongs to).
- No milestones, tasks, or time tracking of any kind — task-level work is explicitly meant to
  live outside this system (originally: Trello; that integration itself was never built
  either).

## Related

[[Database/Projects|Database Projects]] · [[Backend/API|Backend API]] ·
[[Frontend/Pages|Frontend Pages]] · [[Phase 1]]
