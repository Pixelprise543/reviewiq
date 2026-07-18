"""
Review fetching service.
Priority: Google Places API → SerpApi → Demo data (never fail on stage).
"""

import os
import httpx
import asyncio
from typing import Optional
from services.demo_data import get_demo_business, MONTHLY_TREND_TEMPLATE
import logging

logger = logging.getLogger(__name__)

GOOGLE_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY", "")
SERPAPI_KEY = os.getenv("SERPAPI_KEY", "")


async def search_business(query: str) -> dict:
    """Search for a business. Returns normalized business data."""

    # Only hit external APIs if keys are actually configured — skip immediately if not
    if GOOGLE_API_KEY:
        try:
            result = await _google_places_search(query)
            if result:
                return result
        except Exception as e:
            logger.warning(f"Google Places failed: {e}")

    if SERPAPI_KEY:
        try:
            result = await _serpapi_search(query)
            if result:
                return result
        except Exception as e:
            logger.warning(f"SerpApi failed: {e}")

    # No keys or all failed — return a shell instantly with the searched name
    logger.info(f"No API keys configured, returning shell for: {query}")
    return {
        "name": query.title(),
        "address": "",
        "rating": None,
        "total_reviews": 0,
        "category": "Business",
        "phone": "",
        "website": "",
        "reviews": [],
        "monthly_trends": {},
    }


async def _google_places_search(query: str) -> Optional[dict]:
    """Fetch from Google Places API."""
    async with httpx.AsyncClient(timeout=1.0) as client:
        # Find place
        find_resp = await client.get(
            "https://maps.googleapis.com/maps/api/place/findplacefromtext/json",
            params={
                "input": query,
                "inputtype": "textquery",
                "fields": "place_id,name,formatted_address,rating,user_ratings_total,geometry",
                "key": GOOGLE_API_KEY,
            }
        )
        find_data = find_resp.json()
        
        if not find_data.get("candidates"):
            return None
        
        place = find_data["candidates"][0]
        place_id = place["place_id"]
        
        # Get details + reviews
        detail_resp = await client.get(
            "https://maps.googleapis.com/maps/api/place/details/json",
            params={
                "place_id": place_id,
                "fields": "name,rating,formatted_address,formatted_phone_number,website,opening_hours,price_level,reviews,user_ratings_total,types",
                "key": GOOGLE_API_KEY,
            }
        )
        detail_data = detail_resp.json().get("result", {})
        
        reviews = []
        for i, r in enumerate(detail_data.get("reviews", [])):
            reviews.append({
                "id": f"g_{i}",
                "author": r.get("author_name", "Anonymous"),
                "rating": r.get("rating", 3),
                "date": _timestamp_to_date(r.get("time", 0)),
                "text": r.get("text", ""),
                "month": _timestamp_to_month(r.get("time", 0)),
            })
        
        return {
            "place_id": place_id,
            "name": detail_data.get("name", query),
            "address": detail_data.get("formatted_address", ""),
            "rating": detail_data.get("rating", 0),
            "total_reviews": detail_data.get("user_ratings_total", 0),
            "phone": detail_data.get("formatted_phone_number", ""),
            "website": detail_data.get("website", ""),
            "category": _extract_category(detail_data.get("types", [])),
            "price_level": detail_data.get("price_level", 2),
            "reviews": reviews,
        }


async def _serpapi_search(query: str) -> Optional[dict]:
    """Fallback: SerpApi Google Maps results."""
    async with httpx.AsyncClient(timeout=1.0) as client:
        resp = await client.get(
            "https://serpapi.com/search",
            params={
                "engine": "google_maps",
                "q": query,
                "api_key": SERPAPI_KEY,
                "type": "search",
            }
        )
        data = resp.json()
        
        results = data.get("local_results", [])
        if not results:
            return None
        
        place = results[0]
        
        # Fetch reviews separately
        reviews = []
        place_id = place.get("place_id", "")
        if place_id:
            rev_resp = await client.get(
                "https://serpapi.com/search",
                params={
                    "engine": "google_maps_reviews",
                    "place_id": place_id,
                    "api_key": SERPAPI_KEY,
                    "num": "20",
                }
            )
            rev_data = rev_resp.json()
            for i, r in enumerate(rev_data.get("reviews", [])):
                reviews.append({
                    "id": f"s_{i}",
                    "author": r.get("user", {}).get("name", "Anonymous"),
                    "rating": r.get("rating", 3),
                    "date": r.get("date", ""),
                    "text": r.get("snippet", ""),
                    "month": r.get("date", "")[:7] if r.get("date") else "",
                })
        
        return {
            "place_id": place_id,
            "name": place.get("title", query),
            "address": place.get("address", ""),
            "rating": place.get("rating", 0),
            "total_reviews": place.get("reviews", 0),
            "phone": place.get("phone", ""),
            "website": place.get("website", ""),
            "category": place.get("type", "Business"),
            "price_level": len(place.get("price", "")),
            "reviews": reviews,
        }


def compute_monthly_trends(reviews: list) -> dict:
    """Aggregate reviews by month for trend graphs."""
    from collections import defaultdict
    
    monthly = defaultdict(lambda: {"total_rating": 0, "count": 0, "texts": []})
    
    for review in reviews:
        month = review.get("month", "")
        if month and len(month) == 7:
            monthly[month]["total_rating"] += review.get("rating", 3)
            monthly[month]["count"] += 1
            monthly[month]["texts"].append(review.get("text", ""))
    
    # If we have real data, use it; otherwise fall back to template
    if monthly:
        result = {}
        for month, data in sorted(monthly.items()):
            count = data["count"]
            result[month] = {
                "avg_rating": round(data["total_rating"] / count, 2),
                "review_count": count,
                "sentiment": round(min(max(data["total_rating"] / count / 5, 0), 1), 2),
            }
        return result
    
    return MONTHLY_TREND_TEMPLATE


def _timestamp_to_date(ts: int) -> str:
    from datetime import datetime
    if not ts:
        return ""
    try:
        return datetime.fromtimestamp(ts).strftime("%Y-%m-%d")
    except:
        return ""


def _timestamp_to_month(ts: int) -> str:
    from datetime import datetime
    if not ts:
        return ""
    try:
        return datetime.fromtimestamp(ts).strftime("%Y-%m")
    except:
        return ""


def _extract_category(types: list) -> str:
    type_map = {
        "restaurant": "Restaurant",
        "food": "Restaurant",
        "cafe": "Cafe",
        "bar": "Bar",
        "spa": "Spa & Wellness",
        "gym": "Fitness",
        "hotel": "Hotel",
        "store": "Retail",
        "health": "Healthcare",
        "beauty_salon": "Salon",
    }
    for t in types:
        if t in type_map:
            return type_map[t]
    return types[0].replace("_", " ").title() if types else "Business"
