---
tags: [reference]
---

# Folder Structure

Two top-level apps, plus this documentation vault and the legacy planning docs.

```text
techmanion-portal/
├── AGENTS.md                   # entry point for coding agents — read before editing code
├── vercel.json                 # monorepo deploy routing — see System Architecture
├── docs/                       # this Obsidian vault + legacy planning docs (see below)
├── backend/                    # FastAPI service
└── frontend/                   # React + Vite SPA
```

## `backend/`

```text
backend/
├── app/
│   ├── main.py                 # FastAPI app, CORS, lifespan seed, /health
│   ├── config.py                # pydantic-settings Settings, reads backend/.env
│   ├── database.py              # SQLAlchemy engine + get_db() session dependency
│   ├── security.py              # bcrypt hashing, JWT create/decode
│   ├── core/
│   │   └── errors.py              # get_or_404() shared helper
│   ├── api/
│   │   ├── __init__.py             # exposes `router`
│   │   ├── router.py               # aggregates every domain router
│   │   ├── dependencies.py         # CurrentUser / AdminUser / DbSession
│   │   └── routes/
│   │       ├── auth.py               # /auth/*, /users/*
│   │       ├── employees.py           # /employees/*, /documents/*
│   │       ├── hiring.py               # /jobs/*, /candidates/*
│   │       ├── projects.py              # /projects/*
│   │       ├── payroll.py                # /payroll/*
│   │       ├── home.py                    # /home
│   │       └── settings.py                 # /settings/*
│   ├── models/                  # SQLAlchemy ORM models + enums, one module per domain
│   │   ├── common.py, auth.py, organization.py, employees.py, hiring.py,
│   │   │   projects.py, payroll.py, activity.py
│   │   └── __init__.py            # re-exports every model/enum
│   ├── schemas/                  # Pydantic request/response models, one module per domain
│   │   ├── common.py, auth.py, employees.py, hiring.py, projects.py, payroll.py, home.py
│   │   └── __init__.py            # re-exports every schema
│   ├── services/                 # business logic, one module per domain
│   │   ├── activity.py, employees.py, hiring.py, projects.py, payroll.py, home.py
│   │   └── __init__.py            # re-exports the public API
│   └── repositories/              # repeated eager-loaded queries only
│       ├── employees.py, candidates.py, projects.py, payroll.py
├── alembic/
│   ├── env.py
│   └── versions/
│       ├── 20260725_01_initial.py             # base schema (create_all)
│       ├── 20260730_02_hiring.py              # adds Job, Candidate
│       ├── 20260730_03_simplify_projects_payroll.py  # replaces Payroll*/TaxSlab with PayrollEntry, trims Project
│       └── 20260730_04_activity_log.py        # replaces AuditLog with ActivityLog
├── tests/
│   ├── conftest.py              # points DATABASE_URL at a test database
│   ├── test_api.py              # health check + anonymous-request rejection
│   └── test_services.py         # employee_current_salary() unit test
├── uploads/                     # local disk storage for employee documents (dev)
├── requirements.txt / requirements-dev.txt
├── alembic.ini
└── .env / .env.example
```

See [[Backend/Architecture|Backend Architecture]] for what each package does at runtime,
and [[Backend/API|API]] for the endpoints defined in `api/routes/`.

## `frontend/`

```text
frontend/
├── index.html                   # font/icon links, theme-flash-prevention script
├── vite.config.ts                # @vitejs/plugin-react + @tailwindcss/vite, port 5173
├── src/
│   ├── main.tsx                  # ReactDOM root: BrowserRouter > ThemeProvider > AuthProvider > App
│   ├── App.tsx                    # <Routes> table, ProtectedLayout, RequireAdmin
│   ├── auth.tsx                   # AuthContext (login/logout/current user)
│   ├── theme.tsx                  # ThemeContext (light/dark, data-theme attribute)
│   ├── styles.css                 # Tailwind import + design-token CSS variables
│   ├── types.ts                    # TS types mirroring backend Pydantic schemas
│   ├── hooks/
│   │   ├── useDebouncedValue.ts     # generic debounce hook (search inputs)
│   │   └── useHiringData.ts          # data/CRUD layer for the Hiring page
│   ├── lib/
│   │   ├── api/                     # one thin wrapper module per domain
│   │   │   ├── client.ts              # fetch wrapper, ApiError, getToken/setToken
│   │   │   ├── auth.ts, employees.ts, hiring.ts, projects.ts, payroll.ts,
│   │   │   │   home.ts, settings.ts, users.ts
│   │   │   └── index.ts                # re-exports everything above
│   │   ├── format.ts                # formatMoney/formatDate/label/roleLabel/initials
│   │   ├── options.ts                # shared enum option arrays (statuses, roles, ...)
│   │   └── nav.ts                    # NAV_ITEMS / ADMIN_NAV_ITEMS (sidebar config)
│   ├── pages/                       # one file per route — see Frontend/Pages
│   │   ├── login.tsx, home.tsx, hiring.tsx, employees.tsx, employee-form.tsx,
│   │   │   employee-detail.tsx, projects.tsx, project-detail.tsx, payroll.tsx,
│   │   │   team.tsx, profile.tsx, settings.tsx
│   └── components/
│       ├── atoms/                  # Avatar, Badge(StatusChip), Button, Icon, IconButton,
│       │                            # Input, Loading, Logo, Select, Textarea, Typography
│       ├── molecules/               # EmployeeAssignSelect, EmployeeCell, EmptyState,
│       │                            # FilterSelect, FormField, MoneyInput, PageHeaderActions,
│       │                            # SearchInput, TableActionMenu, UserMenu
│       └── organisms/               # AppHeader, AppShell, DataTable, EmployeeTable,
│                                    # FilterToolbar, PageHeader, PayrollSummary, ProfileHeader,
│                                    # Sidebar, plus the per-feature panels/tables added for
│                                    # Hiring, Payroll, Home, Projects, Employees — see
│                                    # Frontend/Components for the full current list
├── eslint.config.js
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── package.json
├── vercel.json
└── .env / .env.example
```

See [[Frontend/Pages|Frontend Pages]] and [[Frontend/Components|Frontend Components]] for what
lives in each of the folders above.

## `docs/`

```text
docs/
├── Home.md                      # ← this vault's entry point
├── Project Overview.md, System Architecture.md, Tech Stack.md, Folder Structure.md
├── Database/  Backend/  Frontend/  Features/  Decisions/  Development/
│                                 # ← this vault (generated), including
│                                 #   Development/AI Coding Conventions.md — the canonical,
│                                 #   binding rulebook for any agent editing this codebase
├── architecture.md               # legacy pre-rewrite planning docs (not part of this vault's
├── data-model.md                 #   structure; kept for historical reference — see Phase 1)
├── decisions.md
├── design-doc.md
├── planning-doc.md
└── software-house-management-system-spec.md
```

> [!warning] Filename collisions across folders
> `Home.md`, `Employees.md`, `Hiring.md`, `Projects.md`, and `Payroll.md` each exist in **two**
> places in this vault (root/`Database`/`Features`). Links to these always use a
> folder-qualified path, e.g. `[[Features/Payroll|Payroll]]`, to resolve unambiguously in
> Obsidian.

## Related

[[System Architecture]] · [[Tech Stack]] · [[Backend/Architecture|Backend Architecture]] ·
[[Frontend/Routing|Frontend Routing]] · [[AI Coding Conventions]]
