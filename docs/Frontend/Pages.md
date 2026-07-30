---
tags: [frontend]
---

# Frontend Pages

Source: `frontend/src/pages/*.tsx`. One file per screen. Pages compose organisms/molecules and
own page-level data fetching and UI state — they do not embed full inline tables/forms
themselves (those are `organisms/`, see [[Frontend/Components|Components]] and
[[AI Coding Conventions]] §2). See [[Frontend/Routing|Routing]] for how these map to URLs, and
the `Features/` folder (e.g. [[Features/Home|Home]]) for user-facing behavior per module.

| File | Route(s) | Purpose |
|---|---|---|
| `login.tsx` | `/login` | Email/password form, calls `useAuth().login()` |
| `home.tsx` | `/home` | Landing dashboard: quick actions, needs-attention/upcoming panels, recent activity feed — see [[Features/Home\|Features/Home]] |
| `hiring.tsx` | `/hiring` | Tabbed Candidates/Jobs management + convert-to-employee flow; data/CRUD layer lives in `hooks/useHiringData.ts` |
| `employees.tsx` | `/employees` | Employee directory: search, filter, table |
| `employee-form.tsx` | `/employees/new`, `/employees/:id/edit` | One component, two modes (create vs. edit) |
| `employee-detail.tsx` | `/employees/:id` | Tabbed employee profile: Overview, Compensation, Documents |
| `projects.tsx` | `/projects` | Project list, filters, inline create form, quick-assign |
| `project-detail.tsx` | `/projects/:id` | View/edit a project, manage its team roster, delete |
| `payroll.tsx` | `/payroll` | Month selector, generate payroll, manual entry CRUD, mark paid |
| `team.tsx` | `/team` (admin) | Create/deactivate portal login accounts, change roles |
| `profile.tsx` | `/profile` | Current user's own name + password change |
| `settings.tsx` | `/settings` (admin) | Departments/designations lists |

## Data-fetching pattern (shared by nearly every page)

```tsx
import { listResource } from "../lib/api/resource";

function load() {
  listResource(params).then(setState).catch((reason: Error) => setError(reason.message));
}
useEffect(load, [/* dependencies */]);
```

- No React Query / SWR / global cache — each page owns its own `useState` + `useEffect` calling
  a `lib/api/<domain>.ts` function (never a raw `api()` call with a hardcoded path — see
  [[Frontend/State Management|State Management]]), and re-fetches by calling `load()` again
  after a mutation.
- List pages that filter server-side (`employees.tsx`, `hiring.tsx`) debounce the search input
  with the shared `hooks/useDebouncedValue.ts` hook rather than fetching on every keystroke.
- Forms are plain controlled components (`useState` object + `onChange` spreads) — no form
  library (React Hook Form, Formik, etc.).
- `hiring.tsx` is the one page whose data/CRUD layer is factored into a dedicated hook
  (`hooks/useHiringData.ts`) rather than living inline, because it coordinates three related
  entities (jobs, candidates, conversion) across two tabs — see [[AI Coding Conventions]] §3
  for when a page-specific hook like this is (and isn't) warranted.

See [[Frontend/State Management|State Management]] for the full pattern and
[[Frontend/Components|Components]] for the shared UI pieces every page composes.

## Notable page-specific behavior

- **`employee-detail.tsx`** renders exactly 3 tabs (`Overview`, `Compensation`, `Documents`),
  all fully implemented — there are no placeholder tabs. Overview shows only real fields (name,
  email, phone, job title, employment type, status, joining date); there is no fabricated
  demo/stat data anywhere on this page.
- **`home.tsx`** renders four `QuickAction` links (`Add Candidate`, `Add Employee`, `Add
  Project`, `Open Payroll`) that navigate to real routes, and its three panels
  (`Needs Attention`, `Upcoming`, `Recent Activity`) are backed by `GET /home` — see
  [[Features/Home|Features/Home]].
- **`employee-form.tsx`** hides the compensation fields entirely when editing (`!isEdit &&
  (...)`) — base salary can only be set at creation time through this form; subsequent changes
  go through the "Add Revision" flow on the detail page's Compensation tab.
- **`project-detail.tsx`** and **`payroll.tsx`** were the two pages rewritten as part of the
  Phase 1 Projects/Payroll simplification (see [[Phase 1]]); all pages were later refactored
  again to extract their tables/forms into `organisms/` — see [[AI Coding Conventions]].

## Related

[[Frontend/Routing|Frontend Routing]] · [[Frontend/Components|Frontend Components]] ·
[[Frontend/State Management|Frontend State Management]] · [[Features/Home|Features]] ·
[[AI Coding Conventions]]
