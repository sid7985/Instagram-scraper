"""Encrypted storage for the Instagram sessionid cookie.

The sessionid is encrypted with Fernet (AES-128-CBC + HMAC) before it is
written to SQLite. The encryption key comes from the SESSION_KEY env var;
set it to a random value in production.
"""

import sqlite3
import threading
from datetime import datetime, timezone
from pathlib import Path

from cryptography.fernet import Fernet, InvalidToken


class SessionStore:
    def __init__(self, db_path: Path, key: str):
        self._lock = threading.Lock()
        self._fernet = Fernet(self._derive_key(key))
        self._db = str(db_path)
        self._init_db()

    def _derive_key(self, secret: str) -> bytes:
        # Fernet needs a valid urlsafe base64 32-byte key; derive one via SHA-256.
        import base64
        import hashlib

        digest = hashlib.sha256(secret.encode("utf-8")).digest()
        return base64.urlsafe_b64encode(digest)

    def _init_db(self) -> None:
        with self._lock:
            with sqlite3.connect(self._db) as conn:
                conn.execute(
                    """
                    CREATE TABLE IF NOT EXISTS sessions (
                        id INTEGER PRIMARY KEY CHECK (id = 1),
                        sessionid_enc TEXT NOT NULL,
                        created_at TEXT NOT NULL,
                        updated_at TEXT NOT NULL
                    )
                    """
                )

    def save(self, session_id: str) -> None:
        now = datetime.now(timezone.utc).isoformat()
        encrypted = self._fernet.encrypt(session_id.encode("utf-8")).decode("ascii")
        with self._lock:
            with sqlite3.connect(self._db) as conn:
                conn.execute(
                    """
                    INSERT INTO sessions (id, sessionid_enc, created_at, updated_at)
                    VALUES (1, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        sessionid_enc = excluded.sessionid_enc,
                        updated_at = excluded.updated_at
                    """,
                    (encrypted, now, now),
                )

    def get(self) -> str | None:
        with self._lock:
            with sqlite3.connect(self._db) as conn:
                row = conn.execute(
                    "SELECT sessionid_enc FROM sessions WHERE id = 1"
                ).fetchone()
        if not row:
            return None
        try:
            return self._fernet.decrypt(row[0].encode("ascii")).decode("utf-8")
        except InvalidToken:
            return None

    def is_set(self) -> bool:
        return self.get() is not None

    def delete(self) -> None:
        with self._lock:
            with sqlite3.connect(self._db) as conn:
                conn.execute("DELETE FROM sessions WHERE id = 1")
