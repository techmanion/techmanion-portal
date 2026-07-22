# Software House Management System — Specification Document

## 1. Purpose

This document lists all functionalities and specifications for an internal system to manage a software house's operations: employees, salaries, and project assignments. Project *task-level* management (tickets, boards) will remain on Trello — this system handles the business/admin layer around it.

---

## 2. Module: Employee Onboarding & Management

### 2.1 Onboarding
- Add new employee profile (personal info, CNIC/ID, contact, address, emergency contact)
- Upload documents (CV, contracts, ID copies, degrees/certificates)
- Assign employee type: **Full-time**, **Part-time**, **Contract/Freelance**
- Assign role/designation (e.g., Developer, QA, PM, Designer)
- Assign department/team
- Set joining date, probation period, and confirmation date
- Generate/assign company email or Trello access (manual step, just log it)
- Digital offer letter / employment contract generation (optional, later phase)
- Onboarding checklist tracker (equipment issued, accounts created, NDA signed, etc.)

### 2.2 Employee Management
- Employee directory (searchable, filterable by role/team/status)
- Edit/update employee profile
- Employee status: Active, On Leave, Resigned, Terminated
- Offboarding workflow (exit date, asset return checklist, final settlement trigger)
- Document storage per employee (contracts, warnings, appraisals)
- Attendance tracking (check-in/out or daily marking — manual or integration-based)
- Leave management (leave types: casual, sick, annual; leave requests, approval workflow, leave balance)
- Performance notes / appraisal history (simple log, not a full HR suite initially)
- Role-based access control (Admin, HR, Manager, Employee views)

---

## 3. Module: Salary Management

### 3.1 Compensation Types
- **Fixed Monthly Salary** — set base salary, auto-generate monthly payslip
- **Hourly Basis** — set hourly rate, log hours (manual entry or timesheet), auto-calculate pay
- **Contract/Project Basis** — fixed amount per contract/project, milestone-based or lump-sum payment

### 3.2 Core Features
- Timesheet/hours logging (per employee, per project/client — needed for hourly billing)
- Monthly payroll run (auto-calculate based on type: fixed / hours × rate / contract terms)
- Deductions & additions (tax, provident fund, loans/advances, bonuses, overtime)
- Payslip generation (PDF, downloadable/emailable)
- Salary payment status tracking (Pending, Paid, Partially Paid)
- Payment history per employee
- Bank/payment details storage (account number, IBAN, or payment method)
- Currency handling (if working with international clients/contractors)
- Tax/withholding calculation (basic, configurable by region — Pakistan tax slabs if applicable)
- Salary revision history (raises, promotions, rate changes with effective dates)
- Export reports (monthly payroll summary, per-employee earning statements)

---

## 4. Module: Project Assignment

*(Actual task/ticket management stays in Trello — this module only tracks assignment, allocation, and high-level status.)*

- Project/Client registry (name, client, start date, end date, status, budget/contract value)
- Assign employees to projects (many-to-many: one employee → multiple projects)
- Define role per project (e.g., Lead Dev, QA, Designer on Project X)
- Allocation percentage (e.g., 50% on Project A, 50% on Project B) — useful for capacity planning
- Link Trello board URL to project (just a reference link, no deep integration needed initially)
- Project status tracking (Planning, In Progress, On Hold, Completed, Cancelled)
- Employee workload/capacity view (who's overloaded, who's free)
- Project-wise hours logged (ties into hourly salary/billing)
- Project-wise cost tracking (salary cost allocated to a project, for profitability insight)
- Project timeline/milestones (high-level, not task-level)

---

## 5. Additional Modules Crucial for a Software House Startup

### 5.1 Client Management (CRM-lite)
- Client directory (contact info, company, communication history)
- Contract/agreement storage per client
- Client-project linkage

### 5.2 Invoicing & Finance
- Generate invoices per client/project (especially for hourly/contract billing)
- Invoice status tracking (Draft, Sent, Paid, Overdue)
- Expense tracking (office expenses, subscriptions, tools, utilities)
- Basic accounting overview (income vs expense, monthly cash flow)
- Integration-ready design for future accounting tools (QuickBooks, etc.)

### 5.3 Attendance & Leave
- Daily attendance log
- Leave request/approval workflow
- Public holiday calendar
- Attendance reports (for payroll accuracy, especially hourly staff)

### 5.4 Document & Asset Management
- Company document repository (policies, templates, SOPs)
- Asset management (laptops, licenses issued to employees, return tracking)

### 5.5 Notifications & Communication
- Email/in-app notifications (leave approvals, payslip generated, project assigned)
- Announcements board (company-wide notices)

### 5.6 Reporting & Analytics Dashboard
- Headcount overview
- Payroll cost overview (monthly/quarterly)
- Project profitability (cost vs contract value)
- Employee utilization report (billable vs non-billable hours)
- Attrition/turnover tracking

### 5.7 Roles & Permissions
- Admin (full access)
- HR (employee & payroll access)
- Project Manager (project & assignment access, view-only on salary)
- Employee (self-service: own profile, payslips, leave requests, attendance)

### 5.8 Settings & Configuration
- Company profile settings
- Departments/roles configuration
- Leave policy configuration
- Salary/tax rule configuration
- Working hours/holiday calendar setup

---

## 6. Non-Functional / Foundational Considerations

- **Authentication & Security**: secure login, password policies, role-based access, audit logs for sensitive actions (salary changes, terminations)
- **Data Privacy**: employee personal and financial data must be protected (especially salary info — restrict visibility strictly)
- **Backup & Recovery**: regular database backups
- **Scalability**: system should handle growth from a handful of employees to 50+ without redesign
- **Multi-device Access**: responsive web app at minimum; mobile-friendly for attendance/leave requests
- **Audit Trail**: who changed what and when (especially payroll and employee records)
- **Notifications via Email**: at least for payslips, leave status, and onboarding steps

---

## 7. Suggested Build Phases (for later planning)

1. **Phase 1 (MVP)**: Employee management, basic onboarding, fixed salary payroll, project assignment (linked to Trello)
2. **Phase 2**: Hourly/contract salary support, timesheets, payslip generation, leave & attendance
3. **Phase 3**: Client management, invoicing, expense tracking, reporting dashboard
4. **Phase 4**: Analytics, role-based permissions refinement, asset management, audit logs

---

## 8. Open Questions to Resolve Before Planning Phase

- What's the initial team size, and how fast do you expect to grow?
- Will this be used only internally, or could it later be sold as a product to other software houses?
- Do you need multi-currency support (international clients/contractors)?
- What's your target tech stack / hosting preference?
- Do you need tax calculation specific to Pakistan, or configurable for multiple regions?
- Should employees have self-service access (view own payslip, apply for leave) from day one?
