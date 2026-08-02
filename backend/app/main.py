import secrets
from contextlib import asynccontextmanager
from datetime import date
from uuid import uuid4

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api import router
from app.config import settings
from app.database import SessionLocal
from app.models import (
    CompanyProfile,
    Department,
    Designation,
    Employee,
    EmployeeStatus,
    EmployeeType,
    User,
)
from app.security import hash_password
from app.services.employees import issue_employee_identifier

CORE_MEMBERS = [
    {"first_name": "Zaryab", "last_name": "Ahmad", "email": "zaryab@techmanion.com"},
    {"first_name": "Moosa", "last_name": "Malik", "email": "moosa@techmanion.com"},
    {"first_name": "Usama", "last_name": "Riasat", "email": "usama@techmanion.com"},
]


def _seed_core_members(db: Session) -> None:
    designation = db.scalar(select(Designation).where(Designation.name == "Co-Founder"))
    if not designation:
        designation = Designation(name="Co-Founder")
        db.add(designation)
        db.flush()

    for member in CORE_MEMBERS:
        if db.scalar(select(User).where(User.email == member["email"])):
            continue

        employee = db.scalar(select(Employee).where(Employee.email == member["email"]))
        if not employee:
            employee = Employee(
                first_name=member["first_name"],
                last_name=member["last_name"],
                cnic=f"PENDING-{uuid4().hex[:10].upper()}",
                email=member["email"],
                phone="",
                employee_type=EmployeeType.EXECUTIVE,
                status=EmployeeStatus.ACTIVE,
                designation_id=designation.id,
                joining_date=date.today(),
            )
            db.add(employee)
            db.flush()
            issue_employee_identifier(db, employee, EmployeeType.EXECUTIVE)

        password = secrets.token_urlsafe(9)
        db.add(
            User(
                email=member["email"],
                password_hash=hash_password(password),
                name=f"{member['first_name']} {member['last_name']}",
                role=EmployeeType.EXECUTIVE,
                employee_id=employee.id,
            )
        )
        print(  # noqa: T201
            f"Seeded core member account: {member['email']} / temporary password: {password}"
        )


def seed_defaults() -> None:
    with SessionLocal() as db:
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
        db.flush()
        _seed_core_members(db)
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
    allow_origins=settings.frontend_url_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
