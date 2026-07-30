---
tags: [feature]
---

# Feature: Home

Route `/home`, component `frontend/src/pages/home.tsx`. The landing page after login. Backed
by `GET /home` (`backend/app/api/routes/home.py`, business logic in
`backend/app/services/home.py: build_home_feed()` — see [[Backend/Services|Backend Services]]).

## What's implemented

- Personalized greeting: `"Hi, {firstName}"` derived from the logged-in user's name.
- **Quick actions** (`QuickActionsPanel` organism): four links that navigate to
  `/hiring?action=add-candidate`, `/employees/new`, `/projects?action=add-project`, and
  `/payroll` respectively — all four are real navigation, not decorative.
- **Needs Attention** (`UpcomingItemsPanel`): items due within 7 days, drawn from the same pool
  as Upcoming below, plus a synthetic "N payroll entries pending" item when there is at least
  one `PENDING` payroll entry.
- **Upcoming** (`UpcomingItemsPanel`): the next 12 dated items across three sources —
  candidates with an upcoming interview, employees with a future joining date, and projects
  with a future/open end date — merged and sorted by date.
- **Recent Activity** (`ActivityFeed`): the 12 most recent `ActivityLog` rows for
  `Employee`/`Job`/`Candidate`/`Project`/`PayrollEntry`, each linking to the relevant page where
  applicable (`DELETE` actions don't link anywhere, since the row is gone).

All four sections are real data, not placeholders — see [[Backend/Services|Backend Services]]
`§ build_home_feed()` for the exact query/merge logic.

## Deep links used by "Add Candidate" / "Add Project"

- `/hiring?action=add-candidate` — `hiring.tsx` reads this query param on mount and opens the
  "add candidate" form immediately (also pre-selects the first open job).
- `/projects?action=add-project` — `projects.tsx` reads this query param (admin-only) and opens
  the "new project" form immediately.

## Related

[[Frontend/Pages|Frontend Pages]] (`home.tsx`) · [[Backend/Services|Backend Services]] ·
[[Backend/API|Backend API]] · [[Frontend/Components|Frontend Components]]
