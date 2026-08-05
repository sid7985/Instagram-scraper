"""Categorised error types instead of a generic 'Error'."""

from enum import Enum


class ScrapeErrorType(str, Enum):
    INVALID_URL = "Invalid URL"
    PRIVATE_ACCOUNT = "Private Account"
    DELETED_POST = "Deleted Post"
    NOT_FOUND = "Not Found"
    SESSION_EXPIRED = "Session Expired"
    CHECKPOINT_REQUIRED = "Checkpoint Required"
    RATE_LIMITED = "Rate Limited"
    NETWORK_ERROR = "Network Error"
    UNKNOWN = "Unknown Error"


class ScrapeError(Exception):
    def __init__(self, error_type: ScrapeErrorType, message: str = ""):
        self.error_type = error_type
        self.message = message or error_type.value
        super().__init__(self.message)

    def to_dict(self) -> dict:
        return {"type": self.error_type.value, "message": self.message}
