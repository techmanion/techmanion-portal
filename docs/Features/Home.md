---
tags: [feature]
---

# Feature: Home

Route `/home`, component `frontend/src/pages/home.tsx`. The landing page after login.

## What's implemented

- Personalized greeting: `"Hi, {firstName}"` derived from the logged-in user's name.
- A static `PageHeader` with a description line.
- A row of four `QuickAction` buttons: **Add candidate**, **Add employee**, **New project**,
  **Run payroll**.
- Three sectioned panels: **Needs Attention**, **Upcoming**, **Recent Activity**.

## Planned / not implemented

> [!warning] This page is a visual shell
> - The four `QuickAction` buttons render with **no `onClick` handler** — clicking them does
>   nothing. They are not yet wired to navigate to `/employees/new`, `/projects`, `/payroll`,
>   or a candidate form.
> - **Needs Attention**, **Upcoming**, and **Recent Activity** each always render a static
>   `EmptyState` ("Nothing needs your attention right now.", "No upcoming events.", "No recent
>   activity yet.") — there is no API call backing any of them and no data source exists for
>   "attention items" or "activity" anywhere in the backend.

This matches the legacy [[planning-doc]]'s original intent that v1's home page should be a
simple directory/dashboard shell rather than a full analytics dashboard — but even the
lightweight version described there (an employee directory) isn't what ships; today it is
purely decorative placeholders. See [[Known Limitations]].

## Related

[[Frontend/Pages|Frontend Pages]] (`home.tsx`) · [[Known Limitations]] · [[Future Roadmap]]
