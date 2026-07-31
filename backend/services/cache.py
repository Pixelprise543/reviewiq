"""
Zero-cost in-memory TTL cache.

Stdlib only — no Redis, no external service, nothing to pay for. Lives in
the FastAPI process's memory for the lifetime of the process. That's the
right tradeoff here: this app doesn't run multiple backend workers, and
the goal is simply to stop re-paying for Groq / Google Places / SerpApi
calls when the same request comes in again (repeat demo searches, judges
re-testing the same business, users flipping between reply personalities
and back, etc).

Not durable across restarts and not shared across processes — if you ever
scale to multiple workers or need persistence, swap TTLCache's internals
for Redis without changing any call sites.
"""

import hashlib
import json
import logging
import time
from typing import Any, Optional

logger = logging.getLogger(__name__)

DEFAULT_TTL_SECONDS = 3600  # 1 hour
DEFAULT_MAX_ENTRIES = 500   # bounds memory growth; oldest entries evicted first


class TTLCache:
    """A tiny thread-unsafe-but-fine-for-asyncio in-memory cache with expiry."""

    def __init__(self, ttl_seconds: int = DEFAULT_TTL_SECONDS, max_entries: int = DEFAULT_MAX_ENTRIES):
        self._store: dict[str, tuple[float, Any]] = {}
        self._ttl = ttl_seconds
        self._max_entries = max_entries
        self._hits = 0
        self._misses = 0

    def get(self, key: str) -> Optional[Any]:
        entry = self._store.get(key)
        if entry is None:
            self._misses += 1
            return None

        expires_at, value = entry
        if expires_at < time.time():
            del self._store[key]
            self._misses += 1
            return None

        self._hits += 1
        return value

    def set(self, key: str, value: Any) -> None:
        self._evict_expired()
        self._evict_oldest_if_full()
        self._store[key] = (time.time() + self._ttl, value)

    def stats(self) -> dict:
        total = self._hits + self._misses
        return {
            "entries": len(self._store),
            "hits": self._hits,
            "misses": self._misses,
            "hit_rate": round(self._hits / total, 3) if total else 0.0,
        }

    def _evict_expired(self) -> None:
        now = time.time()
        expired_keys = [k for k, (expires_at, _) in self._store.items() if expires_at < now]
        for k in expired_keys:
            del self._store[k]

    def _evict_oldest_if_full(self) -> None:
        if len(self._store) < self._max_entries:
            return
        # Evict the entry with the soonest expiry (i.e. the oldest insertion,
        # since all entries share the same TTL window).
        oldest_key = min(self._store, key=lambda k: self._store[k][0])
        del self._store[oldest_key]


def make_key(*parts: Any) -> str:
    """Build a stable cache key by hashing arbitrary JSON-serializable parts.

    Using a hash (rather than the raw JSON) keeps keys a fixed, short size
    even when inputs are large — e.g. a full batch of review text.
    """
    raw = json.dumps(parts, sort_keys=True, default=str)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()
