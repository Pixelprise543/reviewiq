# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React (Vite) + FastAPI. Recharts for data visualization. Deployed as a SPA served by a Python backend.

## Users

Restaurant and local business owners who monitor Google review health. They use the tool post-search to diagnose problems, prepare replies, and compare themselves to nearby competitors. Secondary: operators running multiple locations who want a fast diagnostic snapshot.

## Product Purpose

ReviewIQ turns raw Google reviews into an actionable intelligence report — surfacing recurring issues, sentiment trends, competitor gaps, and AI-generated reply drafts — so business owners can stop guessing and start fixing the right things first.

## Positioning

The only review analysis tool that goes from a business name to a prioritized action plan (issues ranked by frequency + severity, competitor benchmarks, one-click reply drafts, weekly report) in under 30 seconds — without requiring logins, integrations, or manual data entry.

## Operating Context

Business owners search by name + location, then navigate a six-tab dashboard: Overview (sentiment + key metrics), Issues (prioritized problems with solutions), Trends (rating over time, month-by-month), Competitors (nearby businesses with rating gaps), Replies (AI draft for 1–3★ reviews), Report (weekly narrative). Session-based: no persistent accounts.

## Capabilities and Constraints

- Six dashboard tabs: Overview, Issues, Trends, Competitors, Replies, Report
- Live data via SerpAPI (Google Maps / Reviews) + Groq AI (llama-3.3-70b-versatile)
- Demo mode with pre-seeded data when no API keys are configured
- Up to 6 SerpAPI key slots for round-robin rotation + 429 fallback
- Recharts for all data visualization
- No user accounts, no persistence between sessions

## Brand Commitments

- Name: ReviewIQ
- No gradients anywhere — ever. Flat color, shadow, and motion provide all depth.
- No purple or dark accent colors in light mode.
- Light mode is primary; dark mode is a theme toggle.
- Heavy motion: scroll-reveal, spring physics, count-up numbers, micro-interactions on every interactive element.

## Evidence on Hand

Demo data: "The Golden Fork" restaurant in Austin — real-shaped review data, competitor list, monthly trend data, keyword analysis. All synthetic, labeled as such.

## Product Principles

1. Fastest path to insight — one search, one report, zero friction.
2. Motion is substance — every number, card, and chart entrance is orchestrated, not decorative.
3. Clarity over density — the most critical finding dominates; everything else is discoverable.
4. Light by default — the operating environment is a bright office screen; dark mode is an opt-in preference.
5. Flat and precise — no gradients, no glass, no noise; depth lives in shadows and spacing.
