"""Instagram Analytics Dashboard Pro - FastAPI backend entrypoint."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from auth import SessionStore
from config import (
    CORS_ORIGINS,
    DATA_DIR,
    EXPORT_DIR,
    LOG_DIR,
    SESSION_DB_PATH,
    SESSION_KEY,
    ensure_dirs,
)
from services import init_job_manager
from utils import setup_logging

logger = setup_logging(LOG_DIR)

session_store: SessionStore | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global session_store
    ensure_dirs()
    session_store = SessionStore(SESSION_DB_PATH, SESSION_KEY)
    init_job_manager(EXPORT_DIR)
    logger.info("Instagram Analytics backend started")
    yield
    logger.info("Instagram Analytics backend stopped")


app = FastAPI(title="Instagram Analytics Dashboard Pro", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from api import jobs_router, session_router, upload_router

app.include_router(session_router)
app.include_router(upload_router)
app.include_router(jobs_router)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}
