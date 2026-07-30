"""Add Job and Candidate tables for the Hiring module.

Revision ID: 20260730_02
Revises: 20260725_01
"""

from alembic import op
from app import models  # noqa: F401
from app.database import Base

revision = "20260730_02"
down_revision = "20260725_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    Base.metadata.create_all(bind=op.get_bind())


def downgrade() -> None:
    Base.metadata.tables["candidates"].drop(bind=op.get_bind())
    Base.metadata.tables["jobs"].drop(bind=op.get_bind())
