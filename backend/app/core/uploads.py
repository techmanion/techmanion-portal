from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile

from app.config import settings

MAX_AVATAR_BYTES = 5 * 1024 * 1024
AVATAR_SUBDIR = "avatars"


async def store_avatar(file: UploadFile) -> str:
    if not (file.content_type or "").startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed.")
    contents = await file.read()
    if len(contents) > MAX_AVATAR_BYTES:
        raise HTTPException(status_code=413, detail="Images must be 5 MB or smaller.")
    extension = Path(file.filename or "").suffix
    key = f"{uuid4().hex}{extension}"
    directory = settings.upload_dir / AVATAR_SUBDIR
    directory.mkdir(parents=True, exist_ok=True)
    (directory / key).write_bytes(contents)
    return key


def delete_avatar(key: str | None) -> None:
    if not key:
        return
    path = settings.upload_dir / AVATAR_SUBDIR / key
    if path.exists():
        path.unlink()
