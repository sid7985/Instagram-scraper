"""Central configuration for the Instagram Analytics backend."""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", BASE_DIR / "uploads"))
EXPORT_DIR = Path(os.getenv("EXPORT_DIR", BASE_DIR / "exports"))
LOG_DIR = Path(os.getenv("LOG_DIR", BASE_DIR / "logs"))
DATA_DIR = Path(os.getenv("DATA_DIR", BASE_DIR / "data"))

ALLOWED_EXTENSIONS = {".xlsx", ".xls"}

SESSION_KEY = os.getenv(
    "SESSION_KEY",
    "change-me-to-a-random-32-byte-secret-before-deploying",
)
SESSION_DB_PATH = DATA_DIR / "sessions.db"

MAX_WORKERS = int(os.getenv("MAX_WORKERS", "3"))
RETRY_DELAYS = [2, 5, 10, 30]  # seconds, exponential backoff
MAX_RETRIES = len(RETRY_DELAYS) + 1
REQUEST_SLEEP_MIN = float(os.getenv("REQUEST_SLEEP_MIN", "2.0"))
REQUEST_SLEEP_MAX = float(os.getenv("REQUEST_SLEEP_MAX", "4.0"))
HTTP_TIMEOUT = int(os.getenv("HTTP_TIMEOUT", "20"))

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",
]

CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000",
).split(",")


def ensure_dirs() -> None:
    for path in (UPLOAD_DIR, EXPORT_DIR, LOG_DIR, DATA_DIR):
        path.mkdir(parents=True, exist_ok=True)
