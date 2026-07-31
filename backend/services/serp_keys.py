"""
SerpAPI key pool with round-robin rotation and per-key 429 backoff.

Keys are read from environment variables:
  SERPAPI_KEY        (legacy / slot 1)
  SERPAPI_KEY_1 … SERPAPI_KEY_5

All non-empty values are pooled. Requests rotate through them in order.
If a key returns HTTP 429 it is paused for BACKOFF_SECONDS before reuse.
"""

import os
import time
import itertools
import threading
import logging

logger = logging.getLogger(__name__)

BACKOFF_SECONDS = 60  # how long to skip a key after a 429


def _load_keys() -> list[str]:
    slots = [
        os.getenv("SERPAPI_KEY", ""),
        os.getenv("SERPAPI_KEY_1", ""),
        os.getenv("SERPAPI_KEY_2", ""),
        os.getenv("SERPAPI_KEY_3", ""),
        os.getenv("SERPAPI_KEY_4", ""),
        os.getenv("SERPAPI_KEY_5", ""),
    ]
    # Deduplicate while preserving order; drop empty strings
    seen = set()
    result = []
    for k in slots:
        k = k.strip()
        if k and k not in seen:
            seen.add(k)
            result.append(k)
    return result


class _KeyPool:
    def __init__(self):
        self._lock = threading.Lock()
        self._keys: list[str] = []
        self._blocked_until: dict[str, float] = {}  # key → epoch when usable again
        self._cycle = None
        self._reload()

    def _reload(self):
        self._keys = _load_keys()
        self._cycle = itertools.cycle(self._keys) if self._keys else None

    def reload(self):
        """Call after updating env vars at runtime (e.g. from an admin endpoint)."""
        with self._lock:
            self._reload()

    @property
    def count(self) -> int:
        return len(self._keys)

    def available_keys(self) -> list[str]:
        now = time.monotonic()
        return [k for k in self._keys if self._blocked_until.get(k, 0) <= now]

    def next_key(self) -> str:
        """Return the next available key (round-robin, skipping blocked ones)."""
        with self._lock:
            if not self._keys:
                raise RuntimeError(
                    "No SerpAPI keys configured. Add SERPAPI_KEY (or SERPAPI_KEY_1 … "
                    "SERPAPI_KEY_5) to backend/.env and restart the server."
                )
            now = time.monotonic()
            # Try up to len(keys) candidates from the cycle
            for _ in range(len(self._keys)):
                key = next(self._cycle)
                if self._blocked_until.get(key, 0) <= now:
                    return key
            # All keys blocked — return the one that unblocks soonest
            best = min(self._keys, key=lambda k: self._blocked_until.get(k, 0))
            wait = max(0.0, self._blocked_until.get(best, 0) - now)
            logger.warning(f"All SerpAPI keys are rate-limited. Next available in {wait:.1f}s.")
            return best

    def mark_rate_limited(self, key: str):
        with self._lock:
            until = time.monotonic() + BACKOFF_SECONDS
            self._blocked_until[key] = until
            logger.warning(
                f"SerpAPI key ...{key[-6:]} rate-limited; backing off for {BACKOFF_SECONDS}s."
            )

    def status(self) -> list[dict]:
        """Return a list of key status dicts (for the settings UI)."""
        now = time.monotonic()
        result = []
        for i, k in enumerate(self._keys):
            blocked_until = self._blocked_until.get(k, 0)
            remaining = max(0.0, blocked_until - now)
            result.append({
                "slot": i + 1,
                "suffix": f"…{k[-6:]}",
                "available": remaining == 0,
                "backoff_remaining_s": round(remaining),
            })
        return result


# Module-level singleton
_pool = _KeyPool()


def get_key() -> str:
    return _pool.next_key()


def mark_rate_limited(key: str):
    _pool.mark_rate_limited(key)


def reload_keys():
    _pool.reload()


def pool_status() -> dict:
    return {
        "total_keys": _pool.count,
        "available_keys": len(_pool.available_keys()),
        "keys": _pool.status(),
    }
