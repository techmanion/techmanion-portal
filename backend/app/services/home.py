from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models import (
    ActivityLog,
    Candidate,
    CandidateStage,
    Employee,
    EmployeeStatus,
    PayrollEntry,
    PayrollEntryStatus,
    Project,
    ProjectStatus,
)
from app.schemas import ActivityOut, HomeItem, HomeOut


def build_home_feed(db: Session) -> HomeOut:
    today = date.today()
    attention_cutoff = today + timedelta(days=7)

    candidates = db.scalars(
        select(Candidate)
        .where(
            Candidate.interview_date >= today,
            Candidate.stage.not_in([CandidateStage.HIRED, CandidateStage.REJECTED]),
        )
        .options(selectinload(Candidate.job))
        .order_by(Candidate.interview_date)
        .limit(20)
    ).all()
    employees = db.scalars(
        select(Employee)
        .where(
            Employee.joining_date >= today,
            Employee.status == EmployeeStatus.ACTIVE,
        )
        .options(selectinload(Employee.designation))
        .order_by(Employee.joining_date)
        .limit(20)
    ).all()
    projects = db.scalars(
        select(Project)
        .where(
            Project.end_date >= today,
            Project.status != ProjectStatus.COMPLETED,
        )
        .order_by(Project.end_date)
        .limit(20)
    ).all()

    upcoming = [
        *[
            HomeItem(
                kind="INTERVIEW",
                title=f"Interview with {candidate.full_name}",
                description=candidate.job.title,
                event_date=candidate.interview_date,
                href="/hiring",
            )
            for candidate in candidates
        ],
        *[
            HomeItem(
                kind="JOINING",
                title=f"{employee.full_name} is joining",
                description=employee.designation.name
                if employee.designation
                else "New employee",
                event_date=employee.joining_date,
                href=f"/employees/{employee.id}",
            )
            for employee in employees
        ],
        *[
            HomeItem(
                kind="PROJECT_DEADLINE",
                title=f"{project.name} deadline",
                description=project.client_name,
                event_date=project.end_date,
                href=f"/projects/{project.id}",
            )
            for project in projects
        ],
    ]
    upcoming.sort(key=lambda item: item.event_date or date.max)
    upcoming = upcoming[:12]

    needs_attention = [
        item
        for item in upcoming
        if item.event_date is not None and item.event_date <= attention_cutoff
    ]
    pending_payroll = db.scalar(
        select(func.count())
        .select_from(PayrollEntry)
        .where(PayrollEntry.status == PayrollEntryStatus.PENDING)
    )
    if pending_payroll:
        needs_attention.append(
            HomeItem(
                kind="PAYROLL",
                title=f"{pending_payroll} payroll "
                f"{'entry' if pending_payroll == 1 else 'entries'} pending",
                description="Review outstanding employee payments.",
                href="/finance?tab=payroll",
            )
        )

    activities = list(
        db.scalars(
            select(ActivityLog)
            .where(
                ActivityLog.entity.in_(
                    ["Candidate", "Job", "Employee", "Project", "PayrollEntry", "Expense"]
                )
            )
            .order_by(ActivityLog.timestamp.desc())
            .limit(12)
        ).all()
    )
    return HomeOut(
        needs_attention=needs_attention,
        upcoming=upcoming,
        recent_activity=[ActivityOut.model_validate(row) for row in activities],
    )
