from fastapi import APIRouter, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import selectinload

from app.api.dependencies import CurrentUser, DbSession
from app.api.routes.employees import serialize_employee
from app.core.errors import get_or_404
from app.models import Candidate, CandidateStage, Job
from app.repositories.candidates import get_candidate_detailed
from app.repositories.employees import get_employee_detailed
from app.schemas import (
    CandidateCreate,
    CandidateOut,
    CandidateUpdate,
    ConvertToEmployeePayload,
    EmployeeOut,
    JobCreate,
    JobOut,
    JobUpdate,
)
from app.services import convert_candidate_to_employee
from app.services.activity import log_activity

router = APIRouter(tags=["hiring"])


def serialize_candidate(candidate: Candidate) -> CandidateOut:
    return CandidateOut(
        **{
            column.name: getattr(candidate, column.name)
            for column in Candidate.__table__.columns
        },
        job_title=candidate.job.title,
    )


@router.get("/jobs", response_model=list[JobOut])
def list_jobs(db: DbSession, _: CurrentUser) -> list[Job]:
    return list(db.scalars(select(Job).order_by(Job.created_at.desc())).all())


@router.post("/jobs", response_model=JobOut, status_code=status.HTTP_201_CREATED)
def create_job(payload: JobCreate, db: DbSession, user: CurrentUser) -> Job:
    job = Job(**payload.model_dump())
    db.add(job)
    db.flush()
    log_activity(db, "Job", job.id, "CREATE", f"Created job {job.title}")
    db.commit()
    db.refresh(job)
    return job


@router.get("/jobs/{job_id}", response_model=JobOut)
def get_job(job_id: int, db: DbSession, _: CurrentUser) -> Job:
    return get_or_404(db, Job, job_id, "Job was not found.")


@router.put("/jobs/{job_id}", response_model=JobOut)
def update_job(job_id: int, payload: JobUpdate, db: DbSession, user: CurrentUser) -> Job:
    job = get_or_404(db, Job, job_id, "Job was not found.")
    for key, value in payload.model_dump().items():
        setattr(job, key, value)
    log_activity(db, "Job", job.id, "UPDATE", f"Updated job {job.title}")
    db.commit()
    db.refresh(job)
    return job


@router.delete("/jobs/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(job_id: int, db: DbSession, user: CurrentUser) -> None:
    job = get_or_404(db, Job, job_id, "Job was not found.")
    log_activity(db, "Job", job.id, "DELETE", f"Deleted job {job.title}")
    db.delete(job)
    db.commit()


@router.get("/candidates", response_model=list[CandidateOut])
def list_candidates(
    db: DbSession,
    _: CurrentUser,
    search: str = "",
    stage: CandidateStage | None = None,
    job_id: int | None = None,
) -> list[CandidateOut]:
    statement = (
        select(Candidate)
        .options(selectinload(Candidate.job))
        .order_by(Candidate.created_at.desc())
    )
    if search:
        term = f"%{search}%"
        statement = statement.where(
            or_(Candidate.full_name.ilike(term), Candidate.email.ilike(term))
        )
    if stage:
        statement = statement.where(Candidate.stage == stage)
    if job_id:
        statement = statement.where(Candidate.job_id == job_id)
    return [serialize_candidate(row) for row in db.scalars(statement).all()]


@router.post("/candidates", response_model=CandidateOut, status_code=status.HTTP_201_CREATED)
def create_candidate(payload: CandidateCreate, db: DbSession, user: CurrentUser) -> CandidateOut:
    if not db.get(Job, payload.job_id):
        raise HTTPException(status_code=404, detail="Job was not found.")
    candidate = Candidate(**payload.model_dump())
    db.add(candidate)
    db.flush()
    log_activity(db, "Candidate", candidate.id, "CREATE", f"Added candidate {candidate.full_name}")
    db.commit()
    return serialize_candidate(get_candidate_detailed(db, candidate.id))


@router.get("/candidates/{candidate_id}", response_model=CandidateOut)
def get_candidate(candidate_id: int, db: DbSession, _: CurrentUser) -> CandidateOut:
    candidate = get_candidate_detailed(db, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate was not found.")
    return serialize_candidate(candidate)


@router.put("/candidates/{candidate_id}", response_model=CandidateOut)
def update_candidate(
    candidate_id: int, payload: CandidateUpdate, db: DbSession, user: CurrentUser
) -> CandidateOut:
    candidate = get_or_404(db, Candidate, candidate_id, "Candidate was not found.")
    if not db.get(Job, payload.job_id):
        raise HTTPException(status_code=404, detail="Job was not found.")
    for key, value in payload.model_dump().items():
        setattr(candidate, key, value)
    log_activity(
        db, "Candidate", candidate.id, "UPDATE", f"Updated candidate {candidate.full_name}"
    )
    db.commit()
    return serialize_candidate(get_candidate_detailed(db, candidate_id))


@router.delete("/candidates/{candidate_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_candidate(candidate_id: int, db: DbSession, user: CurrentUser) -> None:
    candidate = get_or_404(db, Candidate, candidate_id, "Candidate was not found.")
    log_activity(
        db, "Candidate", candidate.id, "DELETE", f"Deleted candidate {candidate.full_name}"
    )
    db.delete(candidate)
    db.commit()


@router.post(
    "/candidates/{candidate_id}/convert",
    response_model=EmployeeOut,
    status_code=status.HTTP_201_CREATED,
)
def convert_candidate(
    candidate_id: int, payload: ConvertToEmployeePayload, db: DbSession, user: CurrentUser
) -> EmployeeOut:
    candidate = get_or_404(db, Candidate, candidate_id, "Candidate was not found.")
    employee = convert_candidate_to_employee(db, candidate, payload, user)
    return serialize_employee(get_employee_detailed(db, employee.id))
