---
tags: [reference]
---

# Folder Structure

Two top-level apps, plus this documentation vault and the legacy planning docs.

```text
techmanion-portal/
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
│   ├── dependencies.py          # CurrentUser / AdminUser auth dependencies
│   ├── security.py              # bcrypt hashing, JWT create/decode
│   ├── models.py                # all SQLAlchemy ORM models + enums
│   ├── schemas.py                # all Pydantic request/response models
│   ├── api.py                    # every REST endpoint (single router)
│   └── services.py               # employee_current_salary(), audit()
├── alembic/
│   ├── env.py
│   └── versions/
│       ├── 20260725_01_initial.py             # base schema (create_all)
│       ├── 20260730_02_hiring.py              # adds Job, Candidate
│       └── 20260730_03_simplify_projects_payroll.py  # replaces Payroll*/TaxSlab with PayrollEntry, trims Project
├── tests/
│   ├── conftest.py              # points DATABASE_URL at a test database
│   ├── test_api.py              # health check + anonymous-request rejection
│   └── test_services.py         # employee_current_salary() unit test
├── uploads/                     # local disk storage for employee documents (dev)
├── requirements.txt / requirements-dev.txt
├── alembic.ini
└── .env / .env.example
```

See [[Backend/Architecture|Backend Architecture]] for what each `app/` file does at runtime,
and [[Backend/API|API]] for the endpoints defined in `api.py`.

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
│   ├── lib/
│   │   ├── api.ts                  # fetch wrapper, ApiError, login()
│   │   ├── format.ts                # formatMoney/formatDate/label/roleLabel/initials
│   │   └── nav.ts                   # NAV_ITEMS / ADMIN_NAV_ITEMS (sidebar config)
│   ├── pages/                       # one file per route — see Frontend/Pages
│   │   ├── login.tsx
│   │   ├── home.tsx
│   │   ├── hiring.tsx
│   │   ├── employees.tsx
│   │   ├── employee-form.tsx
│   │   ├── employee-detail.tsx
│   │   ├── projects.tsx
│   │   ├── project-detail.tsx
│   │   ├── payroll.tsx
│   │   ├── team.tsx
│   │   ├── profile.tsx
│   │   └── settings.tsx
│   └── components/
│       ├── atoms/                  # Avatar, Badge(StatusChip), Button, Checkbox, Divider,
│       │                            # Icon, IconButton, Input, Loading, Logo, Select, Textarea, Typography
│       ├── molecules/               # EmployeeCell, EmptyState, FilterSelect, FormField,
│       │                            # PageHeaderActions, PaginationControls, SearchInput,
│       │                            # TableActionMenu, UserMenu
│       └── organisms/               # AppHeader, AppShell, DataTable, EmployeeTable,
│                                    # FilterToolbar, PageHeader, PayrollSummary, ProfileHeader, Sidebar
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
│                                 # ← this vault (generated)
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
[[Frontend/Routing|Frontend Routing]]
