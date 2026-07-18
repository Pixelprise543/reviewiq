"""
AI Analysis Service — powered by Groq (llama-3.3-70b-versatile).
One batched call per business: extracts issues, sentiment, keywords,
ranked priorities, and actionable solutions.
"""

import os
import json
import logging
from typing import Optional
from groq import Groq

logger = logging.getLogger(__name__)

client = Groq(api_key=os.getenv("GROQ_API_KEY", ""))


async def analyze_reviews(business_name: str, reviews: list, category: str = "Business") -> dict:
    """
    Main analysis: send all reviews to Claude, get structured JSON back.
    Returns issues, keywords, sentiment, solutions, and priority ranking.
    """
    if not reviews:
        return _empty_analysis()

    # Prepare review text — cap at 30 reviews to keep tokens reasonable
    review_sample = reviews[:30]
    reviews_text = "\n\n".join([
        f"[Rating: {r['rating']}/5 | {r.get('date', '')}]\n{r['text']}"
        for r in review_sample
        if r.get("text")
    ])

    prompt = f"""You are a business intelligence analyst reviewing customer feedback for "{business_name}" ({category}).

Analyze these {len(review_sample)} reviews and return ONLY a valid JSON object (no markdown, no explanation):

REVIEWS:
{reviews_text}

Return this exact JSON structure:
{{
  "overall_sentiment": <float 0-1>,
  "summary": "<2-sentence business health summary>",
  "issues": [
    {{
      "id": "<short_slug>",
      "title": "<issue title>",
      "description": "<what customers are saying, specific>",
      "frequency": <number of reviews mentioning this>,
      "severity": "<critical|high|medium|low>",
      "priority_rank": <1-based integer, 1 = most urgent>,
      "category": "<service|food|ambiance|price|cleanliness|wait_time|staff|other>",
      "example_quote": "<direct quote from a review>",
      "solution": "<specific, actionable solution for this business owner>"
    }}
  ],
  "positives": [
    {{
      "title": "<what customers love>",
      "frequency": <count>,
      "example_quote": "<direct quote>"
    }}
  ],
  "keywords": {{
    "negative": [
      {{"word": "<word>", "count": <integer>}}
    ],
    "positive": [
      {{"word": "<word>", "count": <integer>}}
    ]
  }},
  "quick_wins": ["<action 1>", "<action 2>", "<action 3>"],
  "marketing_advice": "<1 paragraph of specific marketing advice based on the reviews>",
  "alert": {{
    "triggered": <true|false>,
    "reason": "<why an alert was triggered, or null>",
    "urgency": "<high|medium|null>"
  }}
}}

Rules:
- Issues sorted by priority_rank (1 = fix immediately)
- Frequency = actual count of reviews mentioning it
- Solutions must be specific to THIS business type and issues, not generic
- Keywords: top 8 each, single words, stemmed (not "waiters" and "waiter" separately)
- Alert triggers if any single issue appears in 3+ reviews in recent dates
- Return ONLY the JSON. No preamble, no explanation."""

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
        )
        raw = completion.choices[0].message.content.strip()
        result = json.loads(raw)
        return result

    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error from Groq: {e}")
        return _fallback_analysis(business_name, reviews)
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        return _fallback_analysis(business_name, reviews)


async def generate_reply(review_text: str, rating: int, business_name: str, personality: str) -> str:
    """
    Generate a review reply with the specified personality.
    Personalities: professional | empathetic | direct
    """
    personality_guides = {
        "professional": "formal, polished, brand-focused. Use 'we' language. Sound like a PR-trained manager.",
        "empathetic": "warm, personal, genuinely caring. Acknowledge feelings first. Sound human and sincere.",
        "direct": "concise, no-fluff, solution-forward. Get to the point in 3-4 sentences max.",
    }
    
    tone = personality_guides.get(personality, personality_guides["professional"])
    sentiment = "negative" if rating <= 2 else "positive" if rating >= 4 else "mixed"
    
    prompt = f"""Write a {sentiment} review response for {business_name}.

Review (Rating: {rating}/5): "{review_text}"

Tone: {tone}

Rules:
- 75-120 words maximum
- For negative reviews: acknowledge the issue, apologize sincerely, offer a concrete next step
- For positive reviews: express genuine gratitude, reinforce what they loved, invite them back
- Never make excuses or get defensive
- Sign off naturally (don't use "Sincerely, [Name]" — just end the response)
- Return ONLY the reply text, nothing else"""

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            max_tokens=300,
            messages=[{"role": "user", "content": prompt}],
        )
        return completion.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Reply generation failed: {e}")
        return _fallback_reply(sentiment, business_name)


async def generate_weekly_report(business_name: str, analysis: dict, trends: dict) -> str:
    """Generate a weekly insight report summary."""
    
    top_issues = analysis.get("issues", [])[:3]
    issues_text = "\n".join([f"- {i['title']} (priority #{i['priority_rank']})" for i in top_issues])
    
    prompt = f"""Write a concise weekly business insight report for {business_name}.

Current overall sentiment: {analysis.get('overall_sentiment', 0.5):.0%}
Top issues this week:
{issues_text}

Quick wins identified: {", ".join(analysis.get("quick_wins", []))}

Write a professional 3-paragraph weekly report:
1. Performance snapshot (2-3 sentences on where they stand)
2. Top priority actions this week (specific, not generic)
3. Encouraging close with one forward-looking recommendation

Return only the report text."""

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            max_tokens=400,
            messages=[{"role": "user", "content": prompt}],
        )
        return completion.choices[0].message.content.strip()
    except Exception as e:
        return "Weekly report generation is temporarily unavailable. Check back shortly."


def _empty_analysis() -> dict:
    return {
        "overall_sentiment": 0.5,
        "summary": "No reviews available to analyze.",
        "issues": [],
        "positives": [],
        "keywords": {"negative": [], "positive": []},
        "quick_wins": [],
        "marketing_advice": "",
        "alert": {"triggered": False, "reason": None, "urgency": None}
    }


def _fallback_reply(sentiment: str, business_name: str) -> str:
    if sentiment == "negative":
        return f"Thank you for sharing your experience. We're sorry this visit didn't meet your expectations — that's not the standard we hold ourselves to at {business_name}. We'd love the opportunity to make it right. Please reach out to us directly so we can address your concerns personally."
    return f"Thank you so much for this wonderful feedback! We're thrilled you had a great experience at {business_name}. Your kind words mean the world to our team. We look forward to welcoming you back soon!"


def _fallback_analysis(business_name: str, reviews: list) -> dict:
    """Simple rule-based fallback if AI call fails."""
    negative = [r for r in reviews if r.get("rating", 3) <= 2]
    positive = [r for r in reviews if r.get("rating", 3) >= 4]
    avg = sum(r.get("rating", 3) for r in reviews) / max(len(reviews), 1)
    
    return {
        "overall_sentiment": round(avg / 5, 2),
        "summary": f"{business_name} has an average rating of {avg:.1f}/5 across {len(reviews)} reviews. {len(negative)} reviews flagged concerns that need attention.",
        "issues": [
            {
                "id": "service_quality",
                "title": "Service Quality",
                "description": "Multiple customers mentioned service-related concerns",
                "frequency": len(negative),
                "severity": "high" if len(negative) > len(reviews) * 0.3 else "medium",
                "priority_rank": 1,
                "category": "service",
                "example_quote": negative[0]["text"][:120] if negative else "",
                "solution": "Implement weekly staff training sessions focused on customer interaction standards and response time targets."
            }
        ] if negative else [],
        "positives": [
            {
                "title": "Positive Experiences",
                "frequency": len(positive),
                "example_quote": positive[0]["text"][:120] if positive else ""
            }
        ] if positive else [],
        "keywords": {"negative": [], "positive": []},
        "quick_wins": ["Respond to all negative reviews within 24 hours", "Train staff on service standards", "Improve follow-up communication"],
        "marketing_advice": "Focus on highlighting your strengths in local marketing while actively working to address the most common complaints.",
        "alert": {
            "triggered": len(negative) >= 3,
            "reason": f"{len(negative)} negative reviews require immediate attention" if len(negative) >= 3 else None,
            "urgency": "high" if len(negative) >= 3 else None
        }
    }
