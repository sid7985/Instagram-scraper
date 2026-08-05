"""Instagram scraper built on instaloader, using the user's sessionid cookie.

Fetching strategy:
  1. Authenticated instaloader context (sessionid cookie)
  2. Per-request retry with exponential backoff (2s / 5s / 10s / 30s)
  3. Random user-agent rotation
  4. Categorised errors (see errors.py) so the UI can react
     (e.g. Session Expired -> pause job and ask for a new sessionid)
"""

import random
import re
import time
from datetime import datetime, timezone

import instaloader

from config import REQUEST_SLEEP_MAX, REQUEST_SLEEP_MIN, RETRY_DELAYS, USER_AGENTS

from .errors import ScrapeError, ScrapeErrorType

SHORTCODE_RE = re.compile(r"/?(?:reel|p|tv|reels)/([A-Za-z0-9_-]{5,})/?")
URL_RE = re.compile(r"instagram\.com", re.IGNORECASE)

_AUTH_FAILURE_MARKERS = (
    "login required",
    "login_required",
    "authentication",
    "checkpoint",
    "challenge",
    "403",
    "401",
)


def is_instagram_url(url: str) -> bool:
    return bool(URL_RE.search(url or ""))


def extract_shortcode(url: str) -> str | None:
    """Return the media shortcode from an Instagram post/reel URL."""
    match = SHORTCODE_RE.search(url or "")
    return match.group(1) if match else None


def classify_exception(exc: Exception, url: str) -> ScrapeError:
    """Map an instaloader/requests exception to a categorised ScrapeError."""

    name = type(exc).__name__
    message = str(exc)[:200]

    if isinstance(exc, instaloader.exceptions.LoginRequiredException):
        return ScrapeError(ScrapeErrorType.SESSION_EXPIRED, message)
    if isinstance(exc, instaloader.exceptions.PrivateProfileNotFollowedException):
        return ScrapeError(ScrapeErrorType.PRIVATE_ACCOUNT, message)
    if isinstance(exc, instaloader.exceptions.QueryReturnedNotFoundException):
        return ScrapeError(ScrapeErrorType.NOT_FOUND, message)
    if isinstance(exc, instaloader.exceptions.QueryReturnedBadRequestException):
        if "wait a few minutes" in message.lower() or "too many" in message.lower():
            return ScrapeError(ScrapeErrorType.RATE_LIMITED, message)
        return ScrapeError(ScrapeErrorType.SESSION_EXPIRED, message)
    if isinstance(exc, instaloader.exceptions.JSONQueryTooDeepException):
        return ScrapeError(ScrapeErrorType.RATE_LIMITED, message)
    if isinstance(exc, instaloader.exceptions.ProfileNotExistsException):
        return ScrapeError(ScrapeErrorType.NOT_FOUND, message)
    if isinstance(exc, (instaloader.exceptions.ConnectionException, OSError)):
        low = message.lower()
        if any(marker in low for marker in ("timed out", "timeout", "connection", "resolve")):
            return ScrapeError(ScrapeErrorType.NETWORK_ERROR, message)
        return ScrapeError(ScrapeErrorType.SESSION_EXPIRED if "login" in low else ScrapeErrorType.NETWORK_ERROR, message)

    low = message.lower()
    if any(marker in low for marker in _AUTH_FAILURE_MARKERS):
        return ScrapeError(ScrapeErrorType.SESSION_EXPIRED, message)
    if "rate limit" in low or "429" in low:
        return ScrapeError(ScrapeErrorType.RATE_LIMITED, message)
    if "invalid" in low or "malformed" in low:
        return ScrapeError(ScrapeErrorType.INVALID_URL, message)

    return ScrapeError(ScrapeErrorType.UNKNOWN, f"{name}: {message}")


class InstagramScraper:
    """Thread-safe scraper instance bound to one Instagram sessionid."""

    def __init__(self, session_id: str):
        if not session_id:
            raise ValueError("session_id is required")
        self.session_id = session_id
        self._loader = self._build_loader()
        self._profile_cache: dict[str, instaloader.Profile] = {}

    # ------------------------------------------------------------------ #
    # Context construction
    # ------------------------------------------------------------------ #
    def _build_loader(self) -> instaloader.Instaloader:
        loader = instaloader.Instaloader(
            download_pictures=False,
            download_videos=False,
            download_video_thumbnails=False,
            download_geotags=False,
            download_comments=False,
            save_metadata=False,
            compress_json=False,
            quiet=True,
            max_connection_attempts=2,
        )
        session = loader.context._session
        session.cookies.set("sessionid", self.session_id, domain=".instagram.com")
        session.cookies.set("ds_user_id", self.session_id.split("%3A")[0], domain=".instagram.com")
        loader.context._session = session
        loader.context._session.headers.update(
            {"User-Agent": random.choice(USER_AGENTS), "X-CSRFToken": "missing"}
        )
        return loader

    def rotate_user_agent(self) -> None:
        self._loader.context._session.headers["User-Agent"] = random.choice(USER_AGENTS)

    # ------------------------------------------------------------------ #
    # Session validation
    # ------------------------------------------------------------------ #
    def validate_session(self) -> bool:
        """Check the sessionid is still accepted by Instagram.

        Fetches a public profile; a LoginRequiredException means the
        session expired or was invalidated.
        """
        try:
            # Fetching any profile requires a valid session nowadays.
            self._loader.get_profile("instagram")
            return True
        except instaloader.exceptions.LoginRequiredException:
            return False
        except Exception:
            # Network hiccups do not imply an invalid session.
            return True

    # ------------------------------------------------------------------ #
    # Per-post fetch with retries
    # ------------------------------------------------------------------ #
    def fetch_post(self, url: str) -> dict:
        """Fetch all metadata for one post/reel URL.

        Raises ScrapeError with a categorised error type on failure.
        """
        if not is_instagram_url(url):
            raise ScrapeError(ScrapeErrorType.INVALID_URL, "Not an Instagram URL")

        shortcode = extract_shortcode(url)
        if not shortcode:
            raise ScrapeError(ScrapeErrorType.INVALID_URL, "Could not extract shortcode from URL")

        last_error: Exception | None = None
        for attempt, delay in enumerate(RETRY_DELAYS + [0]):
            try:
                self.rotate_user_agent()
                post = instaloader.Post.from_shortcode(self._loader.context, shortcode)
                data = self._collect(post, url)
                self._sleep()
                return data
            except ScrapeError:
                raise
            except Exception as exc:
                last_error = exc
                categorized = classify_exception(exc, url)
                if categorized.error_type in (
                    ScrapeErrorType.SESSION_EXPIRED,
                    ScrapeErrorType.CHECKPOINT_REQUIRED,
                    ScrapeErrorType.PRIVATE_ACCOUNT,
                    ScrapeErrorType.INVALID_URL,
                    ScrapeErrorType.NOT_FOUND,
                    ScrapeErrorType.DELETED_POST,
                ):
                    # No point retrying these.
                    raise categorized from exc
                if attempt < len(RETRY_DELAYS):
                    self._loader.context._session.close()
                    self._loader = self._build_loader()
                    time.sleep(delay)
                    continue
                raise categorized from exc

        raise classify_exception(last_error or RuntimeError("fetch failed"), url)

    # ------------------------------------------------------------------ #
    # Data collection
    # ------------------------------------------------------------------ #
    def _collect(self, post: instaloader.Post, url: str) -> dict:
        owner = self._profile(post.owner_username)

        is_reel_url = "/reel/" in url or "/reels/" in url
        media_type = "Reel" if is_reel_url else ("Video" if post.is_video else "Image")

        return {
            "url": url,
            "shortcode": post.shortcode,
            "username": post.owner_username,
            "full_name": getattr(owner, "full_name", "") or "",
            "followers": getattr(owner, "followers", None),
            "following": getattr(owner, "followees", None),
            "verified": bool(getattr(owner, "is_verified", False)),
            "profile_url": f"https://www.instagram.com/{post.owner_username}/",
            "views": int(post.video_view_count) if post.is_video and post.video_view_count else None,
            "likes": int(post.likes) if post.likes else 0,
            "comments": int(post.comments) if post.comments else 0,
            "caption": (post.caption or "").strip(),
            "post_date": self._fmt_date(post.date_utc),
            "media_type": media_type,
            "duration_sec": round(post.video_duration, 2) if post.is_video and post.video_duration else None,
            "location": getattr(post.location, "name", None) or "",
            "hashtags": list(post.caption_hashtags or []),
            "thumbnail_url": post.url or "",
            "post_link": f"https://www.instagram.com/p/{post.shortcode}/",
            "last_updated": self._fmt_date(datetime.now(timezone.utc)),
        }

    def _profile(self, username: str) -> instaloader.Profile:
        if username not in self._profile_cache:
            self._profile_cache[username] = self._loader.get_profile(username)
        return self._profile_cache[username]

    # ------------------------------------------------------------------ #
    # Helpers
    # ------------------------------------------------------------------ #
    def _sleep(self) -> None:
        time.sleep(random.uniform(REQUEST_SLEEP_MIN, REQUEST_SLEEP_MAX))

    @staticmethod
    def _fmt_date(dt) -> str:
        if not dt:
            return ""
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone().strftime("%Y-%m-%d %H:%M:%S")
