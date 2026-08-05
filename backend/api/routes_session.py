"""Session endpoints: check, save, validate."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from auth import SessionStore
from scraper import InstagramScraper

router = APIRouter(prefix="/api/session", tags=["session"])


def _store() -> SessionStore:
    from main import session_store

    return session_store


class SessionPayload(BaseModel):
    session_id: str


@router.get("")
def get_session() -> dict:
    store = _store()
    if not store.is_set():
        return {"set": False, "valid": None}
    return {"set": True, "valid": None}


@router.post("")
def save_session(payload: SessionPayload) -> dict:
    session_id = payload.session_id.strip()

    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID cannot be empty")

    try:
        scraper = InstagramScraper(session_id)
        valid = scraper.validate_session()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not validate session: {str(exc)[:200]}")

    if not valid:
        raise HTTPException(status_code=400, detail="Invalid Session ID")

    _store().save(session_id)
    return {"set": True, "valid": True}


@router.delete("")
def delete_session() -> dict:
    _store().delete()
    return {"set": False}
