---
tags: [feature]
---

# Feature: Hiring

Route `/hiring`, component `frontend/src/pages/hiring.tsx`. Backed by
[[Database/Hiring|Database: Hiring]] and the `/jobs`, `/candidates` endpoints in
[[Backend/API|Backend API]].

## What's implemented

Two tabs, **Candidates** and **Jobs**, sharing one page:

### Candidates tab
- Searchable (`name`/`email`), filterable-by-stage table of candidates.
- Add/edit candidate form: name, email, phone, job (dropdown of existing jobs), stage,
  interview date, resume link (plain URL/text field — no file upload), notes.
- Delete candidate (with confirm).
- **Convert to employee**: available on any candidate not already `HIRED`. Opens a small form
  (employment type, joining date, job title/designation, monthly compensation, currency) and
  calls `POST /candidates/{id}/convert`, which creates a new `Employee` + initial
  `SalaryRevision` and flips the candidate's stage to `HIRED`. See
  [[Database/Hiring|Database Hiring]] for the exact transaction.

### Jobs tab
- List of jobs with title, description, status (`OPEN`/`CLOSED`).
- Create/edit/delete a job. Deleting a job **cascades and deletes all of its candidates** —
  the UI's confirm dialog says so explicitly ("This also removes its candidates").

## Roles

Any logged-in user (`CurrentUser`) can fully manage jobs and candidates — there is no
admin-only restriction on hiring data (unlike Projects).

## Planned / not implemented

- No résumé **file** upload for candidates — only a free-text "resume link" field.
- No pipeline enforcement: a candidate's stage can be set to any value in any order from the
  UI (e.g. straight from `APPLIED` to `HIRED` without going through `INTERVIEW`/`OFFER`); see
  [[Database/Hiring|Database Hiring]].
- No email notifications to candidates at any stage change.

## Related

[[Database/Hiring|Database Hiring]] · [[Backend/API|Backend API]] · [[Frontend/Pages|Frontend Pages]]
