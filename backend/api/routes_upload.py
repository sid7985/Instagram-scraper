"""Upload endpoint: accept the Excel file, read URLs, create a job."""

import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from auth import SessionStore
from config import ALLOWED_EXTENSIONS, UPLOAD_DIR
from excel import load_dataframe, read_urls_from_excel
from services import get_job_manager

router = APIRouter(prefix="/api", tags=["upload"])


def _store() -> SessionStore:
    from main import session_store

    return session_store


@router.post("/upload")
async def upload_excel(file: UploadFile) -> JSONResponse:
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only .xlsx or .xls files are allowed")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    if len(content) > 50 * 1024 * 1024:  # 50 MB cap
        raise HTTPException(status_code=400, detail="File too large (max 50 MB)")

    stored_name = f"{uuid.uuid4().hex}{suffix}"
    input_path = UPLOAD_DIR / stored_name
    input_path.write_bytes(content)

    try:
        df = load_dataframe(input_path)
        url_rows = read_urls_from_excel(input_path)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not read Excel file: {str(exc)[:200]}")

    if not url_rows:
        raise HTTPException(
            status_code=400,
            detail="No Instagram URLs found in the file. Add a column with instagram.com links.",
        )

    job = get_job_manager().create(input_path, df, url_rows)
    job.log("info", f"File {file.filename} uploaded: {len(url_rows)} URLs found")

    return JSONResponse(
        {
            "job_id": job.id,
            "total": job.total,
            "first_urls": [r.url for r in url_rows[:5]],
            "needs_session": not _store().is_set(),
        }
    )
