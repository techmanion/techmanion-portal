---
tags: [development]
---

# Environment Variables

Backend and frontend each have their own `.env` (and a checked-in `.env.example`). They are
read by completely different tools and are never shared — see [[System Architecture]].

## Backend — `backend/.env`

Read by `backend/app/config.py: Settings` (pydantic-settings). All are optional except
`DATABASE_URL`.

| Variable | Default | Used by |
|---|---|---|
| `DATABASE_URL` | *(required, no default)* | `database.py: create_engine()`. Example: `postgresql+psycopg://techmanion:techmanion@localhost:5432/techmanion` |
| `JWT_SECRET` | `"development-only-secret-change-me"` | `security.py` — signs/verifies access tokens. **Must** be overridden outside local dev. |
| `ACCESS_TOKEN_MINUTES` | `480` (8 hours) | `security.py: create_access_token()` — token lifetime |
| `FRONTEND_URL` | `"http://localhost:5173"` | `main.py` CORS `allow_origins` — must exactly match where the SPA is served from |
| `UPLOAD_DIR` | `"uploads"` | `api/routes/employees.py` document upload/download — relative path, created on startup |
| `INITIAL_ADMIN_EMAIL` | `"admin@techmanion.com"` | `main.py: seed_defaults()` |
| `INITIAL_ADMIN_PASSWORD` | `"ChangeMe123!"` | `main.py: seed_defaults()` |

Not overridable by env (hardcoded in `config.py`): `app_name` (`"Techmanion Portal API"`),
`api_prefix` (`"/api/v1"`), `jwt_algorithm` (`"HS256"`).

## Frontend — `frontend/.env`

Read by Vite at build/dev time (`import.meta.env`).

| Variable | Default (if unset in code) | Used by |
|---|---|---|
| `VITE_API_URL` | `"http://localhost:8000/api/v1"` | `lib/api/client.ts` — base URL for every API call, including the special form-encoded login request in `lib/api/auth.ts` |

## Consistency rule

`backend/.env`'s `FRONTEND_URL` and `frontend/.env`'s `VITE_API_URL` must point at each other's
actual serving addresses, or the browser's CORS preflight will fail. There is exactly one
allowed CORS origin (`allow_origins=[settings.frontend_url]`) — not a wildcard, not a list.

## Test environment

`backend/tests/conftest.py` overrides `DATABASE_URL` before any app import:

```python
os.environ["DATABASE_URL"] = os.environ.get(
    "TEST_DATABASE_URL", "postgresql+psycopg://test:test@localhost:5432/techmanion_test",
)
```

Set `TEST_DATABASE_URL` to point pytest at a separate database from your dev one.

## Related

[[Getting Started]] · [[Build & Run]] · [[Backend/Architecture|Backend Architecture]] ·
[[System Architecture]]
