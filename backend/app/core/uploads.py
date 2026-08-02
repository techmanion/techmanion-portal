from functools import lru_cache
from pathlib import Path
from uuid import uuid4

import boto3
from fastapi import HTTPException, UploadFile

from app.config import settings

MAX_AVATAR_BYTES = 5 * 1024 * 1024


@lru_cache
def _s3_client():
    return boto3.client(
        "s3",
        region_name=settings.s3_region,
        aws_access_key_id=settings.aws_access_key_id or None,
        aws_secret_access_key=settings.aws_secret_access_key or None,
    )


async def store_avatar(file: UploadFile, folder: str) -> str:
    if not (file.content_type or "").startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed.")
    contents = await file.read()
    if len(contents) > MAX_AVATAR_BYTES:
        raise HTTPException(status_code=413, detail="Images must be 5 MB or smaller.")
    extension = Path(file.filename or "").suffix
    key = f"avatars/{folder}/{uuid4().hex}{extension}"
    _s3_client().put_object(
        Bucket=settings.s3_bucket_name,
        Key=key,
        Body=contents,
        ContentType=file.content_type or "application/octet-stream",
    )
    return key


def delete_avatar(key: str | None) -> None:
    if not key:
        return
    _s3_client().delete_object(Bucket=settings.s3_bucket_name, Key=key)
