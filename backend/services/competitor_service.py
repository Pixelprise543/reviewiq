import asyncio
import httpx
import logging
from services.cache import TTLCache, make_key
from services.review_service import _parse_serpapi_date, _serpapi_get

logger = logging.getLogger(__name__)

_competitor_cache = TTLCache(ttl_seconds=3600)  # 1 hour


async def _fetch_competitor_reviews(client: httpx.AsyncClient, data_id: str, name: str) -> dict:
    """
    Fetch one page of reviews for a competitor and derive insight signals:
    - top_praise:     most frequent positive themes (words from 4-5★ reviews)
    - top_complaints: most frequent negative themes (words from 1-2★ reviews)
    - recent_rating:  avg rating of the most recent page of reviews
    """
    if not data_id:
        return {}
    try:
        data = await _serpapi_get(client, {
            "engine": "google_maps_reviews",
            "data_id": data_id,
            "sort_by": "newestFirst",
        })

        reviews = data.get("reviews", [])
        if not reviews:
            return {}

        positive = [r for r in reviews if (r.get("rating") or 0) >= 4]
        negative = [r for r in reviews if (r.get("rating") or 0) <= 2]

        STOPWORDS = {"the","a","an","and","or","but","in","on","at","to","for",
                     "of","is","it","was","i","my","we","they","this","that",
                     "with","have","had","not","are","be","were","so","as","our",
                     "very","really","great","good","bad","place","here","just"}

        def top_words(review_list, n=5):
            word_counts = {}
            for r in review_list:
                snippet = (r.get("snippet") or "").lower()
                for word in snippet.split():
                    word = word.strip(".,!?\"'()-")
                    if len(word) >= 4 and word not in STOPWORDS:
                        word_counts[word] = word_counts.get(word, 0) + 1
            return [w for w, _ in sorted(word_counts.items(), key=lambda x: -x[1])[:n]]

        recent_ratings = [r.get("rating") or 0 for r in reviews]
        recent_avg = round(sum(recent_ratings) / len(recent_ratings), 2) if recent_ratings else None

        return {
            "top_praise":      top_words(positive),
            "top_complaints":  top_words(negative),
            "recent_rating":   recent_avg,
            "sample_positive": (positive[0].get("snippet") or "")[:200] if positive else "",
            "sample_negative": (negative[0].get("snippet") or "")[:200] if negative else "",
        }
    except Exception as e:
        logger.warning(f"Review fetch failed for competitor '{name}': {e}")
        return {}


async def find_competitors(business_name: str):
    """Find competitors near a business using SerpApi Google Maps."""

    cache_key = make_key("find_competitors", business_name)
    cached = _competitor_cache.get(cache_key)
    if cached is not None:
        logger.info(f"Competitor cache hit: {business_name}")
        return cached

    async with httpx.AsyncClient(timeout=30) as client:
        # ── Step 1: Resolve the business ────────────────────────────────────────
        search_data = await _serpapi_get(client, {
            "engine": "google_maps",
            "q": business_name,
            "type": "search",
        })

        results = search_data.get("local_results", [])
        if not results and "place_results" in search_data:
            results = [search_data["place_results"]]
        if not results:
            raise ValueError(f"No business found on Google Maps for: '{business_name}'")

        business        = results[0]
        gps             = business.get("gps_coordinates") or business.get("coordinates") or {}
        lat             = gps.get("latitude") or gps.get("lat")
        lng             = gps.get("longitude") or gps.get("lng")
        business_data_id = business.get("data_id", "")
        business_title  = business.get("title", "")
        business_rating = business.get("rating") or 0

        _ct      = business.get("type") or business.get("primary_type") or "restaurant"
        category = _ct[0] if isinstance(_ct, list) else _ct

        logger.info(f"Resolved '{business_title}' · {lat},{lng} · category={category} · rating={business_rating}")

        if not lat or not lng:
            raise RuntimeError(
                f"SerpApi found '{business_title}' but returned no coordinates. "
                f"Keys: {list(business.keys())}"
            )

        # ── Step 2: Broad nearby search ─────────────────────────────────────────
        nearby_data = await _serpapi_get(client, {
            "engine": "google_maps",
            "q": category,
            "ll": f"@{lat},{lng},13z",
            "type": "search",
        })

        nearby_results = nearby_data.get("local_results", [])
        logger.info(f"Nearby raw results: {len(nearby_results)}")

        # ── Step 3: Partition into outperformers vs peers ────────────────────────
        outperformers = []
        peers         = []

        for place in nearby_results:
            if place.get("data_id") == business_data_id:
                continue
            if place.get("title") == business_title:
                continue

            rating        = place.get("rating") or 0
            total_reviews = place.get("reviews") or 0
            name          = place.get("title") or ""
            address       = place.get("address") or ""
            price_raw     = place.get("price") or ""
            price_level   = len(price_raw)
            hours_raw     = place.get("hours") or place.get("operating_hours") or ""

            entry = {
                "name":            name,
                "rating":          rating,
                "total_reviews":   total_reviews,
                "address":         address,
                "website":         place.get("website") or "",
                "phone":           place.get("phone") or "",
                "price_level":     price_level,
                "price_display":   price_raw,
                "hours":           hours_raw,
                "data_id":         place.get("data_id") or "",
                "avg_sentiment":   round(rating / 5, 2),
                "strengths":       [],
                "weaknesses":      [],
                "outperforms_you": rating > business_rating,
                "rating_gap":      round(rating - business_rating, 1),
                "top_praise":      [],
                "top_complaints":  [],
                "recent_rating":   None,
                "sample_positive": "",
                "sample_negative": "",
            }

            if rating > business_rating:
                outperformers.append(entry)
            else:
                peers.append(entry)

        outperformers.sort(key=lambda x: x["rating"], reverse=True)
        peers.sort(key=lambda x: x["rating"], reverse=True)
        logger.info(f"Outperformers: {len(outperformers)} · Peers: {len(peers)}")

        # ── Step 4: Fetch reviews for top 3 outperformers in parallel ───────────
        top_outperformers = outperformers[:3]
        if top_outperformers:
            review_tasks = [
                _fetch_competitor_reviews(client, c["data_id"], c["name"])
                for c in top_outperformers
            ]
            review_results = await asyncio.gather(*review_tasks, return_exceptions=True)
            for comp, result in zip(top_outperformers, review_results):
                if isinstance(result, dict):
                    comp.update(result)

        # Return up to 5 outperformers + up to 3 peers
        competitors = outperformers[:5] + peers[:3]

    _competitor_cache.set(cache_key, competitors)
    return competitors
