---
tags: [frontend]
---

# Frontend State Management

There is **no global state library** (no Redux, Zustand, Jotai, React Query, SWR). State is
one of three things:

1. Two small React Contexts for cross-cutting concerns (auth, theme).
2. Per-page `useState`/`useEffect` for server data, fetched via a `lib/api/<domain>.ts`
   function (occasionally factored into a page-specific `hooks/use*.ts` — see
   [[Frontend/Pages|Pages]]).
3. Local component state for forms/UI toggles.

## `AuthContext` (`frontend/src/auth.tsx`)

```tsx
interface AuthValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}
```

- On mount, if a token exists in `localStorage`, it calls `GET /auth/me` to hydrate `user`;
  otherwise `loading` starts `false` and `user` stays `null` (→ redirected to `/login` by
  `ProtectedLayout`, see [[Frontend/Routing|Routing]]).
- `login()` calls `lib/api/auth.ts: login()` (the special form-encoded endpoint — see
  [[Backend/Authentication|Backend Authentication]]), stores the token, sets `user`.
- `logout()` clears the token and `user` — no server call (JWTs aren't revoked server-side,
  they just aren't sent anymore and eventually expire).
- `updateUser()` is called after `PATCH /auth/me` (profile page) and after an admin changes
  their **own** role/status via the Team page, so the header/sidebar reflect the change
  immediately without a re-login.
- A `401` from *any* API call clears the token via `lib/api/client.ts` (see below) — the next
  `AuthProvider` render then has no token, so `user` becomes `null` on next fetch cycle and the
  route guard redirects.

## `ThemeContext` (`frontend/src/theme.tsx`)

- `theme: "dark" | "light"`, persisted to `localStorage["theme"]` and mirrored onto
  `document.documentElement`'s `data-theme` attribute, which the CSS custom properties in
  `styles.css` key off of. See [[Frontend/UI Architecture|UI Architecture]].
- Initial value: stored preference, else `"dark"`. `index.html` also runs a tiny inline script
  before React loads to set `data-theme` early and avoid a flash of the wrong theme.
- Toggled from `UserMenu` (header avatar dropdown).

## `frontend/src/lib/api/` — the data-access layer

```text
lib/api/
  client.ts       api<T>(), apiBlob(), ApiError, getToken()/setToken() — the only fetch wrapper
  auth.ts         login(), updateProfile(), changePassword()
  employees.ts    listEmployees(), getEmployee(), createEmployee(), updateEmployee(),
                  reviseSalary(), listEmployeeDocuments(), uploadEmployeeDocument(),
                  downloadDocument()
  hiring.ts       listJobs()/createJob()/updateJob()/deleteJob(),
                  listCandidates()/createCandidate()/updateCandidate()/deleteCandidate(),
                  convertCandidate()
  projects.ts     listProjects(), getProject(), createProject(), updateProject(),
                  deleteProject(), assignEmployeeToProject(), unassignEmployeeFromProject()
  payroll.ts      listPayrollEntries(), generatePayroll(), createPayrollEntry(),
                  updatePayrollEntry(), deletePayrollEntry(), markPayrollPaid()
  home.ts         getHomeData()
  settings.ts     listDepartments(), listDesignations(), addDepartment(), addDesignation()
  users.ts        listUsers(), createUser(), updateUser()
  index.ts        re-exports everything above, so `import {...} from "../lib/api"` still works
```

```ts
// client.ts
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    // parse { detail } from body if present, else generic message
    if (response.status === 401) setToken(null);
    throw new ApiError(message, response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}
```

- A page never calls `api()` directly with a hardcoded path for a named resource — it imports
  the matching function from `lib/api/<domain>.ts` (e.g. `listEmployees("")`). Every one of
  those functions is a one-line wrapper around `api()`/`apiBlob()`. See
  [[AI Coding Conventions]] §3.
- `ApiError` carries the HTTP status and a human-readable `detail` message (surfaced directly
  in page-level error banners).
- `apiBlob()` is a second, simpler fetcher used only for document download
  (`GET /documents/{id}/download`), since that response isn't JSON.
- `getToken()`/`setToken()` wrap `localStorage["techmanion_access_token"]`.

## Shared hooks (`frontend/src/hooks/`)

| Hook | Purpose |
|---|---|
| `useDebouncedValue(value, delayMs)` | Returns a debounced copy of `value`; used to delay a server search request until the user pauses typing (`employees.tsx`, and inside `useHiringData`) |
| `useHiringData()` | Bundles the Hiring page's jobs/candidates/designations state, filters, and CRUD calls into one hook — see [[Frontend/Pages|Pages]] |

## Typical page data pattern

```tsx
const [rows, setRows] = useState<T[]>([]);
const [error, setError] = useState("");

function load() {
  listResource().then(setRows).catch((reason: Error) => setError(reason.message));
}
useEffect(load, [/* filters as deps */]);

// after a mutation:
async function create(payload) {
  await createResource(payload);
  load(); // just refetch — no optimistic update, no cache invalidation logic
}
```

This exact shape repeats in every page — see [[Frontend/Pages|Pages]]. There is no
client-side caching between navigations: leaving and returning to a page always refetches.

## Money and dates at the UI boundary

`frontend/src/lib/format.ts`:

- `formatMoney(amount, currency)` — divides minor units by 100 and formats with
  `Intl.NumberFormat`. A field tracked in minor units in form state uses the `MoneyInput`
  molecule to do the inverse conversion instead of a bare `Input` with manual
  `Math.round(Number(value) * 100)` — see [[Frontend/Components|Components]]. See
  [[Database/Schema|Database Schema]] for why amounts are minor units.
- `formatDate(value)` — `Intl.DateTimeFormat`, `"—"` for empty.
- `label(value)` — turns an enum's `SCREAMING_SNAKE_CASE` into `Title Case` for display.
- `roleLabel(value)` — same, with an explicit lookup table for the four `UserRole` values.
- `initials(name)` — used by `Avatar` when no image is available.

`frontend/src/lib/options.ts` centralizes the shared enum option arrays (`EMPLOYEE_TYPES`,
`EMPLOYEE_STATUSES`, `PROJECT_STATUSES`, `JOB_STATUSES`, `CANDIDATE_STAGES`, `USER_ROLES`,
`DOCUMENT_KINDS`) so they aren't re-declared inline per page.

## Related

[[Frontend/Routing|Frontend Routing]] · [[Frontend/Pages|Frontend Pages]] ·
[[Backend/Authentication|Backend Authentication]] · [[Frontend/UI Architecture|Frontend UI Architecture]] ·
[[AI Coding Conventions]]
