---
tags: [feature]
---

# Feature: Payroll

Route `/payroll`, component `frontend/src/pages/payroll.tsx`. Backed by
[[Database/Payroll|Database: Payroll]] and the `/payroll/*` endpoints in
[[Backend/API|Backend API]].

This module is a **complete redesign** from the original payroll-run/payslip/tax-engine
design — see [[Phase 1]].

## What's implemented

- **Month selector** (`<input type="month">`) drives which month's entries are loaded
  (`GET /payroll?month=YYYY-MM`).
- **Generate Payroll** button → `POST /payroll/generate?month=...`. Creates a `PayrollEntry`
  for every `ACTIVE` employee who doesn't already have one for that month, using their current
  salary as of the month. Safe to click repeatedly — it never duplicates or overwrites
  existing entries. See [[Database/Payroll|Database Payroll]] for the full flow diagram.
- **Add entry** — a manual entry form (employee picker, base compensation, adjustment,
  currency, notes) for cases outside the generate flow, e.g. an employee without a current
  salary revision, or a one-off entry.
- **Edit** (pencil icon) — re-opens the same form pre-filled to change base compensation,
  adjustment, currency, or notes on an existing entry.
- **Delete** (trash icon) — removes an entry.
- **Mark paid** — available while an entry is `PENDING`; sets `status = PAID` and
  `paymentDate` to today. There is no "unmark" action.
- **Summary panel**: total employee count for the month, total base compensation, total
  adjustments, total final payable, and a paid/pending progress bar (`PayrollSummary`
  organism).
- Search (by employee name) and status filter (`PENDING`/`PAID`) over the loaded month's
  entries.

## Business rule

> **Final Amount = Base Compensation + Adjustment.** A negative adjustment is a deduction.

Both create and update recompute `finalAmount` server-side — the client never computes or
sends it. See [[Database/Payroll|Database Payroll]].

## One entry per employee per month

Enforced by a database unique constraint on `(employee_id, month)` — attempting to create a
second entry for the same employee/month returns `409` (surfaced as an inline error banner in
the UI).

## Roles

Any logged-in user (`CurrentUser`) can view, generate, create, edit, delete, and mark payroll
entries paid — payroll is **not** admin-restricted, unlike Projects. See
[[Backend/Authentication|Backend Authentication]].

## Removed from the original design

The original payroll design ([[data-model]], [[architecture]]) had a `PayrollRun` →
`Payslip` → `PayslipLineItem` hierarchy with:

- A configurable Pakistan tax-slab engine (auto-computed withholding)
- Gross/tax/net amount breakdown
- A `PARTIALLY_PAID` payment status and partial-paid amount tracking
- Earning/deduction line items with categories (bonus, overtime, advance, provident fund, …)
- A payroll-run-level `DRAFT`/`COMPLETED` status, with payslips becoming immutable once
  completed

None of this exists today. Payroll is a flat list of per-employee, per-month entries with a
single adjustment number and a two-state (`PENDING`/`PAID`) status. See [[Phase 1]] for why.

## Planned / not implemented

- No tax computation of any kind.
- No payslip document (print/PDF) generation.
- No email delivery of pay information.
- No partial payments.

## Related

[[Database/Payroll|Database Payroll]] · [[Backend/API|Backend API]] ·
[[Frontend/Pages|Frontend Pages]] · [[Phase 1]] · [[Future Roadmap]]
