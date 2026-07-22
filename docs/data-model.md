# Software House Management System — Data Model

**Version:** 1.0
**Companion to:** [Planning Document](planning-doc.md) · [Architecture](architecture.md)
**Scope:** v1 (MVP). Entities marked *(Phase 2+)* are designed for but not built yet.

Conventions: every table has `id`, `createdAt`, `updatedAt`. Money is stored as
integer **minor units** plus a `currency` code (default `PKR`) — see
[architecture.md §5](architecture.md). Enums are listed inline.

---

## 1. Entity Overview

```
User ──(role)                       AppUser accounts (Admin/HR in v1)
Employee ──< EmployeeDocument        person + uploaded files
Employee ──< SalaryRevision          effective-dated pay history
Employee ──< BankDetail
Employee ──< ProjectAssignment >── Project
Project  ──> Client                  (Client is Phase 3, nullable FK in v1)
PayrollRun ──< Payslip >── Employee  monthly run and per-employee output
Payslip  ──< PayslipLineItem         earnings/deductions
TaxSlab                              configurable Pakistan slabs
AuditLog                             append-only sensitive-action log
Department, Designation              configurable lists
```

---

## 2. Core Entities (v1)

### User
App login account. **Admin / HR only in v1.**
- `email` (unique), `passwordHash`, `name`
- `role`: `ADMIN | HR | MANAGER | EMPLOYEE` — only ADMIN/HR provisioned in v1
- `isActive`
- Optional `employeeId` → Employee (for future self-service linkage; unused in v1)

### Employee
- Personal: `firstName`, `lastName`, `cnic` (unique), `dateOfBirth`
- Contact: `email`, `phone`, `address`
- Emergency: `emergencyContactName`, `emergencyContactPhone`
- Employment: `type` (`FULL_TIME | PART_TIME | CONTRACT`), `designationId`, `departmentId`
- Dates: `joiningDate`, `probationEndDate`, `confirmationDate`
- `status`: `ACTIVE | ON_LEAVE | RESIGNED | TERMINATED`
- `accessLog` (text) — manual note for "company email / Trello issued"
- Compensation type: `compType` (`FIXED` in v1; `HOURLY | PROJECT` reserved for Phase 2)

### EmployeeDocument
- `employeeId`, `kind` (`CV | CONTRACT | ID_COPY | CERTIFICATE | OTHER`)
- `fileKey` (object-storage key), `fileName`, `mimeType`, `sizeBytes`
- `uploadedByUserId`

### SalaryRevision
Effective-dated; the "current" salary is the latest row whose `effectiveDate <= today`.
- `employeeId`, `baseAmount` (minor units), `currency`
- `effectiveDate`, `reason` (`HIRE | RAISE | PROMOTION | RATE_CHANGE | CORRECTION`)
- `createdByUserId`

### BankDetail
- `employeeId`, `accountTitle`, `accountNumber`, `iban`, `bankName`
- `paymentMethod` (`BANK_TRANSFER | CASH | OTHER`)

---

## 3. Projects

### Project
- `name`, `clientId` (nullable in v1 — Client is Phase 3)
- `clientName` (free text in v1 until CRM exists)
- `status`: `PLANNING | IN_PROGRESS | ON_HOLD | COMPLETED | CANCELLED`
- `startDate`, `endDate`
- `contractValue` (minor units), `currency`
- `trelloUrl`

### ProjectAssignment  *(join table, many-to-many)*
- `projectId`, `employeeId`
- `projectRole` (free text, e.g. "Lead Dev", "QA")
- `allocationPct` (0–100)
- `startDate`, `endDate` (nullable)

Constraint: per employee, sum of `allocationPct` across active projects is surfaced in
UI for capacity, but not hard-blocked in v1.

---

## 4. Payroll

### PayrollRun
One per month.
- `periodMonth` (e.g. `2026-07`), unique
- `status`: `DRAFT | COMPLETED`
- `createdByUserId`

### Payslip
One per employee per run.
- `payrollRunId`, `employeeId`
- `baseAmount`, `currency` (snapshot from SalaryRevision at run time)
- `grossAmount`, `taxAmount`, `netAmount` (all minor units, computed server-side)
- `paymentStatus`: `PENDING | PAID | PARTIALLY_PAID`
- `paidAmount` (minor units), `paidAt`

### PayslipLineItem
- `payslipId`, `type`: `EARNING | DEDUCTION`
- `category`: `BASE | BONUS | OVERTIME | TAX | ADVANCE | PROVIDENT_FUND | OTHER`
- `label`, `amount` (minor units), `currency`

### TaxSlab  *(configurable)*
Pakistan salary slabs, editable in Settings without a deploy.
- `fiscalYear`, `lowerBound` (annual, minor units), `upperBound` (nullable = ∞)
- `fixedAmount` (minor units), `ratePctOverLower`
- The tax engine ([architecture.md §5](architecture.md)) resolves the slab for an
  annualized base and returns monthly withholding.

---

## 5. Configuration & Audit

### Department / Designation
Simple configurable lists (`name`, `isActive`) referenced by Employee.

### CompanyProfile
Single row: `name`, `address`, `defaultCurrency` (`PKR`), `logoText` (text-only logo per [Design Document §3](design-doc.md)).

### AuditLog  *(append-only)*
- `actorUserId`, `action`, `entityType`, `entityId`
- `before` (JSON), `after` (JSON), `createdAt`
- Written in the same transaction as the change ([architecture.md §4](architecture.md)).

---

## 6. Reserved for Later (not built in v1)

*(Phase 2+)* `TimesheetEntry`, `LeaveRequest`, `LeaveBalance`, `AttendanceRecord`,
`OnboardingChecklistItem`, `OffboardingChecklistItem`
*(Phase 3+)* `Client`, `Invoice`, `InvoiceLineItem`, `Expense`
*(Phase 4)* `Asset`, `AssetAssignment`, `CompanyDocument`, `Announcement`

These are named now so v1 tables (nullable `clientId`, the reserved `compType` values,
the unused `MANAGER/EMPLOYEE` roles) don't need reshaping when they arrive.

---

## 7. Key Integrity Rules

- An `Employee` cannot be hard-deleted — status change only (audit + payroll history).
- A `Payslip` is immutable once its `PayrollRun` is `COMPLETED` (corrections = new adjusting line item next run).
- Money on the same record must share one `currency`; v1 does no cross-currency conversion.
- Deleting a `Department`/`Designation` in use is blocked — deactivate instead.
