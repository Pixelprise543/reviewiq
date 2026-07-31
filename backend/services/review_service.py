"""
Review fetching service — SerpApi Google Maps only.
Raises on any failure so the caller can surface a real error to the user.
"""

import os
import re
import httpx
from datetime import datetime, timedelta
from services.cache import TTLCache, make_key
from services import serp_keys
import logging

_MONTH_RE = re.compile(r'^\d{4}-\d{2}$')


def _parse_serpapi_date(date_str: str) -> str:
    """
    Convert SerpAPI's date field to YYYY-MM.

    SerpAPI google_maps_reviews returns relative strings like:
      "a month ago", "3 months ago", "a year ago", "2 weeks ago"
    It sometimes also returns absolute ISO strings like "2024-01-15".
    We handle both.
    """
    if not date_str:
        return ""

    s = date_str.strip()

    # Already an absolute ISO date (YYYY-MM-DD or YYYY-MM)
    if len(s) >= 7 and s[4:5] == "-":
        return s[:7]

    # Strip prefixes like "Edited ", "Updated ", etc.
    s = s.lower()
    for prefix in ("edited ", "updated ", "reviewed "):
        if s.startswith(prefix):
            s = s[len(prefix):]
            break
    now = datetime.now()
    try:
        if "year" in s:
            n = 1 if s.startswith(("a ", "an ")) else int(s.split()[0])
            return f"{now.year - n:04d}-{now.month:02d}"
        elif "month" in s:
            n = 1 if s.startswith(("a ", "an ")) else int(s.split()[0])
            total = now.year * 12 + now.month - n - 1
            return f"{total // 12:04d}-{total % 12 + 1:02d}"
        elif "week" in s:
            n = 1 if s.startswith(("a ", "an ")) else int(s.split()[0])
            d = now - timedelta(weeks=n)
            return d.strftime("%Y-%m")
        elif "day" in s:
            n = 1 if s.startswith(("a ", "an ")) else int(s.split()[0])
            d = now - timedelta(days=n)
            return d.strftime("%Y-%m")
    except Exception:
        pass
    return ""

logger = logging.getLogger(__name__)

# Keys are managed by serp_keys pool — no single SERPAPI_KEY variable needed here

_search_cache = TTLCache(ttl_seconds=1800)  # 30 min


async def search_business(query: str) -> dict:
    """Search for a business via SerpApi. Raises on any failure."""

    cache_key = make_key("search_business", query.strip().lower())
    cached = _search_cache.get(cache_key)
    if cached is not None:
        logger.info(f"Cache hit: search_business('{query}')")
        return cached

    try:
        result = await _serpapi_search(query)
    except Exception as e:
        logger.error(f"SerpApi search failed for '{query}': {e}")
        raise

    _search_cache.set(cache_key, result)
    return result


async def _serpapi_get(client: httpx.AsyncClient, params: dict) -> dict:
    """Make a single SerpAPI request with key-rotation on 429."""
    key = serp_keys.get_key()
    params = {**params, "api_key": key}
    resp = await client.get("https://serpapi.com/search", params=params)
    if resp.status_code == 429:
        serp_keys.mark_rate_limited(key)
        # Retry once with the next key
        key = serp_keys.get_key()
        params["api_key"] = key
        resp = await client.get("https://serpapi.com/search", params=params)
    if resp.status_code != 200:
        raise RuntimeError(f"SerpApi returned HTTP {resp.status_code}: {resp.text[:200]}")
    data = resp.json()
    if "error" in data:
        raise RuntimeError(f"SerpApi error: {data['error']}")
    return data


async def _serpapi_search(query: str) -> dict:
    """Fetch business info + reviews from SerpApi Google Maps."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        data = await _serpapi_get(client, {
            "engine": "google_maps",
            "q": query,
            "type": "search",
        })

        results = data.get("local_results", [])
        if not results and "place_results" in data:
            results = [data["place_results"]]

        if not results:
            raise ValueError(f"No business found on Google Maps for: '{query}'")

        place = results[0]
        data_id = place.get("data_id", "")

        # Fetch reviews with pagination — SerpAPI returns 10/page.
        # We follow next_page_token up to MAX_PAGES to avoid runaway quota spend.
        MAX_REVIEW_PAGES = 50   # 50 pages × 10 reviews = up to 500 reviews
        reviews = []
        next_token = None
        page = 0

        if data_id:
            while page < MAX_REVIEW_PAGES:
                rev_params = {
                    "engine": "google_maps_reviews",
                    "data_id": data_id,
                    "sort_by": "newestFirst",
                }
                if next_token:
                    rev_params["next_page_token"] = next_token

                rev_data = await _serpapi_get(client, rev_params)

                page_reviews = rev_data.get("reviews", [])
                if not page_reviews:
                    break   # no more reviews

                offset = len(reviews)
                for i, r in enumerate(page_reviews):
                    date = r.get("date") or ""
                    month = _parse_serpapi_date(date)
                    reviews.append({
                        "id": f"s_{offset + i}",
                        "author": r.get("user", {}).get("name") or "Anonymous",
                        "rating": int(r.get("rating") or 3),
                        "date": date,
                        "text": r.get("snippet") or "",
                        "month": month,
                    })

                next_token = rev_data.get("serpapi_pagination", {}).get("next_page_token")
                if not next_token:
                    break   # last page

                page += 1

        logger.info(f"Fetched {len(reviews)} reviews across {page + 1} page(s) for '{query}'")

        # ── Capped supplementation ────────────────────────────────────────────
        total_reviews = place.get("reviews") or 0
        is_capped = total_reviews > len(reviews) and len(reviews) > 0

        if is_capped and data_id:
            seen = {(r["author"], r["date"]) for r in reviews}
            before_supp = len(reviews)
            for sort_order in ("ratingLow", "ratingHigh", "mostRelevant"):
                try:
                    supp_data = await _serpapi_get(client, {
                        "engine": "google_maps_reviews",
                        "data_id": data_id,
                        "sort_by": sort_order,
                    })
                    offset = len(reviews)
                    for i, r in enumerate(supp_data.get("reviews", [])):
                        author = r.get("user", {}).get("name") or "Anonymous"
                        date   = r.get("date") or ""
                        dedup_key = (author, date)
                        if dedup_key in seen:
                            continue
                        seen.add(dedup_key)
                        month = _parse_serpapi_date(date)
                        reviews.append({
                            "id": f"s_{sort_order}_{i}",
                            "author": author,
                            "rating": int(r.get("rating") or 3),
                            "date": date,
                            "text": r.get("snippet") or "",
                            "month": month,
                            "supplemental": True,
                        })
                    logger.info(f"[{sort_order}] added {len(reviews) - offset} supplemental reviews for '{query}'")
                except Exception as e:
                    logger.warning(f"Supplemental fetch ({sort_order}) failed for '{query}': {e}")
            logger.info(f"Total supplemental reviews added: {len(reviews) - before_supp}")

        # Use `or` fallbacks — SerpAPI can return a key with value None,
        # in which case dict.get("key", default) still returns None.
        return {
            "place_id": place.get("place_id") or "",
            "name": place.get("title") or query,
            "address": place.get("address") or "",
            "rating": place.get("rating") or 0,
            "total_reviews": place.get("reviews") or 0,
            "phone": place.get("phone") or "",
            "website": place.get("website") or "",
            "category": (_t[0] if isinstance(_t := place.get("type"), list) else _t) or "Business",
            "price_level": len(place.get("price") or ""),
            "reviews": reviews,
        }


def compute_monthly_trends(reviews: list) -> dict:
    """Aggregate reviews by month for trend graphs."""
    from collections import defaultdict

    monthly = defaultdict(lambda: {"total_rating": 0, "count": 0})

    for review in reviews:
        month = review.get("month", "")
        if month and _MONTH_RE.match(month):   # must be exactly YYYY-MM
            monthly[month]["total_rating"] += review.get("rating", 3)
            monthly[month]["count"] += 1

    result = {}
    for month, data in sorted(monthly.items()):
        count = data["count"]
        result[month] = {
            "avg_rating": round(data["total_rating"] / count, 2),
            "review_count": count,
            "sentiment": round(min(max(data["total_rating"] / count / 5, 0), 1), 2),
        }
    return result
