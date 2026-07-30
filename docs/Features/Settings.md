---
tags: [feature]
---

# Feature: Settings

Two admin-only pages, both reachable from the sidebar's "Organization" group
([[Frontend/Routing|Routing]]):

- **`/settings`** (`settings.tsx`) — "Organization": departments, designations
- **`/team`** (`team.tsx`) — "Team Members": portal login account management

Both are wrapped in `RequireAdmin` — see [[Backend/Authentication|Backend Authentication]] for
the (server-side) reason this is safe to gate.

## Organization (`/settings`)

- **Departments** and **Designations**: each is a simple list with an admin-only "add" form
  (name only). Reflects [[Database/Employees|Database: Employees]]`.Department` /
  `.Designation`.
  > [!warning] Add-only
  > There is no way to rename, deactivate, or delete a department/designation from the UI or
  > API — see [[Known Limitations]].

There is no audit/activity log page — recent activity is only surfaced on the
[[Features/Home|Home]] page's "Recent Activity" panel (`GET /home`), not on a dedicated
admin screen. See [[Backend/Services|Backend Services]].

## Team Members (`/team`)

Manages `User` (portal login) accounts — **not** `Employee` records; see
[[Database/Relationships|Database Relationships]] for why these are unrelated models.

- List of all portal accounts: name/email, role (editable inline dropdown), active/inactive
  status, joined date.
- **Add member** form: name, email, temporary password (≥ 8 chars), role — role can be set to
  any of `ADMIN, HR, MANAGER, EMPLOYEE`.
- **Change role**: inline `<select>` per row, disabled for your own row.
- **Activate/Deactivate**: icon button per row, hidden for your own row. The backend also
  independently blocks an admin from deactivating or demoting themselves
  (`400 "You cannot revoke your own admin access."`) even if the UI restriction were bypassed.

> [!info] Role choice has limited effect today
> Although the form lets you create a `MANAGER` or `EMPLOYEE` account, the API does not treat
> those roles differently from `HR` — see [[Backend/Authentication|Backend Authentication]]
> for the exact two-tier (Admin / not-Admin) enforcement.

## Related

[[Database/Employees|Database Employees]] · [[Backend/API|Backend API]] ·
[[Backend/Authentication|Backend Authentication]] · [[Frontend/Pages|Frontend Pages]] ·
[[Known Limitations]]
