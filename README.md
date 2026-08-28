# Techmanion Portal

An internal Admin/HR portal for employee records, fixed-salary payroll, and project
assignments. The implementation follows the product, data, and visual requirements in
[`docs/`](docs/).

## Stack

- Frontend: React 19, TypeScript, Vite
- Backend: FastAPI, SQLAlchemy 2, Alembic, Pydantic
- Database: PostgreSQL

## Run locally

```bash
# API
cd backend
cp .env.example .env
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload

# UI (in a second terminal)
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open <http://localhost:5173>. The marketing site (`techmanion-ug`) runs separately
on <http://localhost:3000>; include both origins in backend `FRONTEND_URLS` so
Careers can call the API without CORS errors:

```
FRONTEND_URLS=http://localhost:5173,http://localhost:3000
```

The API exposes interactive documentation at <http://localhost:8000/docs>.

## Checks

```bash
cd frontend && npm run lint && npm run build
cd backend && TEST_DATABASE_URL=postgresql+psycopg://techmanion:techmanion@localhost:5432/techmanion_test pytest
```

Architecture details and deployment boundaries are documented in
[`docs/architecture.md`](docs/architecture.md).
