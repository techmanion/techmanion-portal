from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.api import router
from app.config import settings
from app.database import SessionLocal
from app.models import CompanyProfile, Department, Designation, User, UserRole
from app.security import hash_password


def seed_defaults() -> None:
    with SessionLocal() as db:
        admin = db.scalar(select(User).where(User.email == settings.initial_admin_email.lower()))
        if not admin:
            db.add(
                User(
                    email=settings.initial_admin_email.lower(),
                    password_hash=hash_password(settings.initial_admin_password),
                    name="Portal Administrator",
                    role=UserRole.ADMIN,
                )
            )
        if not db.scalar(select(Department).limit(1)):
            db.add_all(
                [
                    Department(name="Engineering"),
                    Department(name="Design"),
                    Department(name="Quality Assurance"),
                    Department(name="Operations"),
                ]
            )
        if not db.scalar(select(Designation).limit(1)):
            db.add_all(
                [
                    Designation(name="Software Engineer"),
                    Designation(name="QA Engineer"),
                    Designation(name="Project Manager"),
                    Designation(name="Product Designer"),
                ]
            )
        if not db.get(CompanyProfile, 1):
            db.add(CompanyProfile(id=1))
        db.commit()


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    seed_defaults()
    yield


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router, prefix=settings.api_prefix)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
