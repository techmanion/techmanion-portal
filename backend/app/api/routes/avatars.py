from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.config import settings
from app.core.uploads import AVATAR_SUBDIR

router = APIRouter(tags=["avatars"])


@router.get("/avatars/{file_name}")
def get_avatar(file_name: str) -> FileResponse:
    safe_name = Path(file_name).name
    path = settings.upload_dir / AVATAR_SUBDIR / safe_name
    if not path.exists():
        raise HTTPException(status_code=404, detail="Avatar was not found.")
    return FileResponse(path)
