---
tags: [frontend]
---

# Frontend Pages

Source: `frontend/src/pages/*.tsx`. One file per screen. See [[Frontend/Routing|Routing]] for
how these map to URLs, and the `Features/` folder (e.g. [[Features/Home|Home]]) for
user-facing behavior per module.

| File | Route(s) | Purpose |
|---|---|---|
| `login.tsx` | `/login` | Email/password form, calls `useAuth().login()` |
| `home.tsx` | `/home` | Landing dashboard — mostly static placeholders today, see [[Features/Home\|Features/Home]] |
| `hiring.tsx` | `/hiring` | Tabbed Candidates/Jobs management + convert-to-employee flow |
| `employees.tsx` | `/employees` | Employee directory: search, filter, table |
| `employee-form.tsx` | `/employees/new`, `/employees/:id/edit` | One component, two modes (create vs. edit) |
| `employee-detail.tsx` | `/employees/:id` | Tabbed employee profile (Overview, Compensation, Documents implemented; others are placeholders) |
| `projects.tsx` | `/projects` | Project list, filters, inline create form, quick-assign |
| `project-detail.tsx` | `/projects/:id` | View/edit a project, manage its team roster, delete |
| `payroll.tsx` | `/payroll` | Month selector, generate payroll, manual entry CRUD, mark paid |
| `team.tsx` | `/team` (admin) | Create/deactivate portal login accounts, change roles |
| `profile.tsx` | `/profile` | Current user's own name + password change |
| `settings.tsx` | `/settings` (admin) | Departments/designations lists, audit log |

## Data-fetching pattern (shared by nearly every page)

```tsx
function load() {
  api<T[]>("/resource").then(setState).catch((reason: Error) => setError(reason.message));
}
useEffect(load, [/* dependencies */]);
```

- No React Query / SWR / global cache — each page owns its own `useState` + `useEffect` +
  `api()` call, and re-fetches by calling `load()` again after a mutation.
- List pages that filter server-side (`employees.tsx`, `hiring.tsx`) debounce the fetch with a
  `window.setTimeout(loadX, 180)` cleanup pattern rather than fetching on every keystroke.
- Forms are plain controlled components (`useState` object + `onChange` spreads) — no form
  library (React Hook Form, Formik, etc.).

See [[Frontend/State Management|State Management]] for the full pattern and
[[Frontend/Components|Components]] for the shared UI pieces every page composes.

## Notable page-specific behavior

- **`employee-detail.tsx`** renders 6 tabs (`Overview, Employment, Compensation, Documents,
  Projects, Activity`) but only `Overview`, `Compensation`, and `Documents` have real content;
  the rest render a generic `"{tab} details will appear here."` empty state. See
  [[Features/Employees|Features/Employees]] and [[Known Limitations]].
- **`home.tsx`** renders four `QuickAction` buttons (`Add candidate`, `Add employee`, `New
  project`, `Run payroll`) with **no `onClick` handlers** — purely decorative today. See
  [[Features/Home|Features/Home]] and [[Known Limitations]].
- **`employee-form.tsx`** hides the compensation fields entirely when editing (`!isEdit &&
  (...)`) — base salary can only be set at creation time through this form; subsequent changes
  go through the "Add Revision" flow on the detail page's Compensation tab.
- **`project-detail.tsx`** and **`payroll.tsx`** were the two pages rewritten as part of the
  Phase 1 Projects/Payroll simplification — see [[Phase 1]].

## Related

[[Frontend/Routing|Frontend Routing]] · [[Frontend/Components|Frontend Components]] ·
[[Frontend/State Management|Frontend State Management]] · [[Features/Home|Features]]
