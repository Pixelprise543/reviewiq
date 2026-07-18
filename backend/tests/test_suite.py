"""
ReviewIQ Test Suite
Covers core logic, API endpoints, and fallback behavior.
Run: pytest tests/ -v
"""

import pytest
import asyncio
from unittest.mock import patch, MagicMock, AsyncMock
import json
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# ─── Unit Tests: Demo Data ────────────────────────────────────────────────────

class TestDemoData:
    def test_get_demo_business_exact_match(self):
        from services.demo_data import get_demo_business
        result = get_demo_business("the golden fork")
        assert result["name"] == "The Golden Fork"
        assert result["rating"] == 3.8
        assert len(result["reviews"]) > 0

    def test_get_demo_business_partial_match(self):
        from services.demo_data import get_demo_business
        result = get_demo_business("golden fork restaurant")
        assert result is not None
        assert "name" in result

    def test_get_demo_business_fallback(self):
        from services.demo_data import get_demo_business
        result = get_demo_business("xyzzy nonexistent business 999")
        # Should return first business, never raise
        assert result is not None
        assert "name" in result
        assert "reviews" in result

    def test_get_demo_competitors_match(self):
        from services.demo_data import get_demo_competitors
        result = get_demo_competitors("the golden fork")
        assert isinstance(result, list)
        assert len(result) >= 2
        for comp in result:
            assert "name" in comp
            assert "rating" in comp

    def test_demo_business_has_monthly_months(self):
        from services.demo_data import DEMO_BUSINESSES
        for biz in DEMO_BUSINESSES.values():
            for rev in biz["reviews"]:
                assert "month" in rev
                assert len(rev["month"]) == 7  # YYYY-MM format


# ─── Unit Tests: Review Service ───────────────────────────────────────────────

class TestReviewService:
    def test_compute_monthly_trends_basic(self):
        from services.review_service import compute_monthly_trends
        reviews = [
            {"rating": 5, "month": "2025-06", "text": "great"},
            {"rating": 3, "month": "2025-06", "text": "ok"},
            {"rating": 2, "month": "2025-07", "text": "bad"},
        ]
        result = compute_monthly_trends(reviews)
        assert "2025-06" in result
        assert result["2025-06"]["avg_rating"] == 4.0
        assert result["2025-06"]["review_count"] == 2
        assert "2025-07" in result
        assert result["2025-07"]["avg_rating"] == 2.0

    def test_compute_monthly_trends_empty(self):
        from services.review_service import compute_monthly_trends
        result = compute_monthly_trends([])
        # Should return template, not crash
        assert isinstance(result, dict)
        assert len(result) > 0

    def test_compute_monthly_trends_invalid_months(self):
        from services.review_service import compute_monthly_trends
        reviews = [
            {"rating": 5, "month": "", "text": "great"},
            {"rating": 3, "month": "invalid", "text": "ok"},
        ]
        result = compute_monthly_trends(reviews)
        assert isinstance(result, dict)

    def test_timestamp_to_date(self):
        from services.review_service import _timestamp_to_date
        result = _timestamp_to_date(1735689600)  # 2025-01-01
        assert result.startswith("2025")

    def test_timestamp_to_date_zero(self):
        from services.review_service import _timestamp_to_date
        result = _timestamp_to_date(0)
        assert result == ""

    def test_extract_category(self):
        from services.review_service import _extract_category
        assert _extract_category(["restaurant", "food"]) == "Restaurant"
        assert _extract_category(["spa", "health"]) == "Spa & Wellness"
        assert _extract_category([]) == "Business"


# ─── Unit Tests: AI Service Fallbacks ─────────────────────────────────────────

class TestAIServiceFallbacks:
    def test_fallback_analysis_structure(self):
        from services.ai_service import _fallback_analysis
        reviews = [
            {"rating": 2, "text": "bad service", "date": "2025-07-01"},
            {"rating": 5, "text": "amazing food", "date": "2025-07-02"},
            {"rating": 1, "text": "terrible experience", "date": "2025-07-03"},
        ]
        result = _fallback_analysis("Test Biz", reviews)
        assert "overall_sentiment" in result
        assert "issues" in result
        assert "positives" in result
        assert "keywords" in result
        assert "quick_wins" in result
        assert 0 <= result["overall_sentiment"] <= 1

    def test_fallback_analysis_empty_reviews(self):
        from services.ai_service import _fallback_analysis
        result = _fallback_analysis("Empty Biz", [])
        assert result is not None
        assert "overall_sentiment" in result

    def test_empty_analysis(self):
        from services.ai_service import _empty_analysis
        result = _empty_analysis()
        assert result["overall_sentiment"] == 0.5
        assert result["issues"] == []

    def test_fallback_reply_negative(self):
        from services.ai_service import _fallback_reply
        result = _fallback_reply("negative", "Test Business")
        assert "Test Business" in result
        assert len(result) > 30

    def test_fallback_reply_positive(self):
        from services.ai_service import _fallback_reply
        result = _fallback_reply("positive", "Test Business")
        assert "Test Business" in result
        assert len(result) > 30


# ─── Integration Tests: API Endpoints ─────────────────────────────────────────

class TestAPIEndpoints:
    @pytest.fixture
    def client(self):
        from fastapi.testclient import TestClient
        import importlib.util
        spec = importlib.util.spec_from_file_location("main", os.path.join(os.path.dirname(os.path.dirname(__file__)), "main.py"))
        main = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(main)
        return TestClient(main.app)

    def test_health_check(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"

    def test_search_returns_data(self, client):
        response = client.get("/api/reviews/search?q=the+golden+fork")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "name" in data["data"]
        assert "reviews" in data["data"]

    def test_search_short_query_rejected(self, client):
        response = client.get("/api/reviews/search?q=a")
        assert response.status_code == 422  # Validation error

    def test_search_missing_query_rejected(self, client):
        response = client.get("/api/reviews/search")
        assert response.status_code == 422

    def test_competitors_returns_list(self, client):
        response = client.get("/api/competitors/compare?business=the+golden+fork")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert isinstance(data["data"]["competitors"], list)

    def test_reply_invalid_personality_rejected(self, client):
        response = client.post("/api/replies/generate", json={
            "review_text": "bad experience",
            "rating": 2,
            "business_name": "Test",
            "personality": "angry"  # invalid
        })
        assert response.status_code == 400

    def test_analyze_endpoint_with_mock(self, client):
        with patch("routes.analysis.analyze_reviews", new=AsyncMock(return_value={
            "overall_sentiment": 0.6, "issues": [], "positives": [], "keywords": {"negative": [], "positive": []},
            "quick_wins": [], "marketing_advice": "", "summary": "test", "alert": {"triggered": False}
        })):
            response = client.post("/api/analysis/analyze", json={
                "business_name": "Test",
                "reviews": [{"rating": 3, "text": "ok"}],
                "category": "Restaurant"
            })
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True


# ─── Edge Case Tests ──────────────────────────────────────────────────────────

class TestEdgeCases:
    def test_unicode_business_name(self):
        from services.demo_data import get_demo_business
        result = get_demo_business("café résumé naïve")
        assert result is not None

    def test_very_long_query(self):
        from services.demo_data import get_demo_business
        result = get_demo_business("a" * 500)
        assert result is not None

    def test_monthly_trends_with_missing_fields(self):
        from services.review_service import compute_monthly_trends
        reviews = [{"rating": 4}, {"text": "nice"}, {}]
        result = compute_monthly_trends(reviews)
        assert isinstance(result, dict)

    def test_all_positive_reviews(self):
        from services.ai_service import _fallback_analysis
        reviews = [{"rating": 5, "text": "perfect", "date": "2025-07-01"} for _ in range(10)]
        result = _fallback_analysis("Great Biz", reviews)
        assert result["overall_sentiment"] == 1.0
        assert result["issues"] == []

    def test_all_negative_reviews_triggers_alert(self):
        from services.ai_service import _fallback_analysis
        reviews = [{"rating": 1, "text": "terrible", "date": "2025-07-01"} for _ in range(5)]
        result = _fallback_analysis("Bad Biz", reviews)
        assert result["alert"]["triggered"] is True


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
