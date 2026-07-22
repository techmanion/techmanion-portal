# Software House Management System — Design Document

**Version:** 1.0
**Companion to:** Planning Document (MVP)
**Design direction:** Minimalist, Google-style — clean, quiet, functional. The interface should feel like a well-organized tool, not a branded product.

---

## 1. Design Philosophy

This is an internal admin tool used a few times a week to manage people, money, and projects. The design has exactly one job: **let an admin find, read, and edit records with zero friction.**

Three rules govern every screen:

1. **Content over chrome.** The data (employee names, salary figures, project statuses) is the interface. Everything else — navigation, borders, backgrounds — recedes.
2. **One way to do each thing.** No duplicate paths, no decorative shortcuts. Predictability beats cleverness in an admin tool.
3. **White space is the design.** Like Google's products, structure comes from spacing and alignment, not boxes, borders, and background colors.

If a screen looks "designed," we've done too much.

---

## 2. Visual Language

### 2.1 Color

A near-monochrome palette with a single functional accent. Color is used **only to communicate**, never to decorate.

| Token | Value | Usage |
|---|---|---|
| `surface` | `#FFFFFF` | All page and card backgrounds |
| `surface-alt` | `#F8F9FA` | Table header rows, page background behind cards, hover states |
| `border` | `#E0E0E0` | Hairline dividers only (1px) |
| `text-primary` | `#202124` | Headings, data values |
| `text-secondary` | `#5F6368` | Labels, metadata, captions |
| `accent` | `#1A73E8` | Primary buttons, links, active nav item, focus rings |
| `success` | `#188038` | "Paid", "Active" statuses |
| `warning` | `#E37400` | "Pending", "On Hold" statuses |
| `danger` | `#D93025` | Destructive actions, "Terminated", validation errors |

**Critique rule:** if a color appears on screen and you can't name what it *communicates*, remove it. Gradients, shadows heavier than a subtle elevation, and decorative background colors are banned.

### 2.2 Typography

One typeface, one scale. **Inter** (free, closest neutral match to Google Sans) at these sizes only:

| Role | Size / Weight | Usage |
|---|---|---|
| Page title | 22px / 500 | One per page, top-left |
| Section heading | 16px / 500 | Card titles, form sections |
| Body / data | 14px / 400 | Tables, forms, everything |
| Caption / label | 12px / 400, `text-secondary` | Field labels, metadata, timestamps |

No italics. No more than two weights on any screen. Numbers in tables (salaries, hours, amounts) use tabular figures and right-align.

### 2.3 Spacing & Layout

- **8px grid.** All padding, margins, and gaps are multiples of 8 (4px allowed inside dense components like table cells).
- **Max content width 1200px**, centered, with a fixed 240px left sidebar for navigation.
- **Cards are the only container.** White surface, 8px radius, 1px border *or* a very subtle shadow — never both. No nested cards.
- Page anatomy is identical everywhere: page title + primary action button (top right) → optional filter row → content card.

### 2.4 Components (from shadcn/ui, restyled to tokens above)

Buttons, inputs, selects, tables, dialogs, toasts — used as-is from the library with our tokens applied. Component rules:

- **One primary (filled blue) button per screen.** Everything else is a text or outline button.
- **Tables are the default view** for all lists (employees, payroll, projects). Row height 48px, hairline row dividers, `surface-alt` header. No zebra striping.
- **Status = text chip:** small rounded label, tinted background at ~10% opacity of its status color, colored text. This is the *only* place tinted backgrounds appear.
- **Forms are single-column**, max 560px wide, labels above fields. Group with section headings, not boxes.
- **Dialogs only for short tasks** (confirm delete, mark paid, quick assign). Anything with 5+ fields gets its own page, not a modal.
- **Empty states** are one line of text plus the relevant action button. No illustrations.

### 2.5 Motion

Almost none. 150ms ease on hover/focus transitions and dialog fade-in. Nothing animates on page load. Respect `prefers-reduced-motion`.

---

## 3. Key Screen Patterns

| Screen | Pattern |
|---|---|
| Employee directory | Search field + 2 filters, table (Name, Role, Type, Status, Joined), row click → detail |
| Employee detail | Header (name, status chip, Edit button), tabbed sections: Profile / Compensation / Documents / Payroll history / Projects |
| Payroll run | Month picker, table of all active employees with editable line items inline, per-row "Mark paid" |
| Payslip | Print-optimized plain page: company name, employee, month, line items, net — black on white, no styling beyond typography |
| Projects | Table view; project detail shows assigned members with role + allocation |
| Login | Centered 360px card, logo (text only), email, password, one button |

---

## 4. Design Critique Checklist

Every screen must pass this review before it ships. This is the "design critique" — run it literally, item by item:

**Minimalism**
- [ ] Could anything be removed without losing function? (If yes, remove it.)
- [ ] Is there exactly one filled/primary button on this screen?
- [ ] Are all colors traceable to the token table, and does each one communicate something?
- [ ] Zero decorative elements: no illustrations, icons-for-decoration, gradients, or drop shadows beyond card elevation?

**Consistency**
- [ ] Does the page follow the standard anatomy (title → action → filters → card)?
- [ ] Are all spacings on the 8px grid?
- [ ] Do buttons/labels use the same verbs as everywhere else? ("Save changes" always saves changes; "Mark paid" always marks paid.)

**Clarity**
- [ ] Can a new admin tell what this screen is for within 3 seconds, without instructions?
- [ ] Are labels written in plain human terms (never system terms)?
- [ ] Do errors say what went wrong *and* how to fix it, without apologizing?
- [ ] Are money values right-aligned, tabular, with currency shown?

**Function**
- [ ] Usable at 1280px laptop width AND readable on a phone (tables may scroll horizontally on mobile — that's acceptable for v1)?
- [ ] Visible keyboard focus on every interactive element?
- [ ] Is the most common action on this screen reachable in one click?

A screen that fails any item goes back. No exceptions for "we'll fix it later."

---

## 5. What We Deliberately Reject

To keep the direction honest, these common patterns are explicitly out:

- Dashboards with stat cards, charts, and graphs on the home page — v1 home is just the employee directory
- Dark mode (later, maybe never — it's an internal daytime tool)
- Custom icon sets — Lucide icons only, 20px, `text-secondary` color, and only where a label alone is insufficient
- Branded loading screens, skeleton shimmer effects — a plain spinner is fine
- Any component built from scratch that the library already provides

---

## 6. Summary

The finished product should feel like Google Workspace admin console's calmer sibling: white, quiet, fast, and so predictable it's boring. Boring is the goal — the excitement belongs in the payroll being correct.
