from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.api.dependencies import DbSession
from app.api.routes.hiring import serialize_job
from app.models import CompanyProfile, Job, JobStatus
from app.schemas import JobOut, OrganizationOut

router = APIRouter(tags=["public"])


@router.get("/jobs", response_model=list[JobOut])
def list_open_jobs(db: DbSession) -> list[JobOut]:
    statement = (
        select(Job).where(Job.status == JobStatus.OPEN).order_by(Job.created_at.desc())
    )
    return [serialize_job(job) for job in db.scalars(statement).all()]


@router.get("/jobs/{job_id}", response_model=JobOut)
def get_open_job(job_id: int, db: DbSession) -> JobOut:
    job = db.get(Job, job_id)
    if not job or job.status != JobStatus.OPEN:
        raise HTTPException(status_code=404, detail="Job was not found.")
    return serialize_job(job)


@router.get("/organization", response_model=OrganizationOut)
def get_public_organization(db: DbSession) -> CompanyProfile:
    return db.get(CompanyProfile, 1)
