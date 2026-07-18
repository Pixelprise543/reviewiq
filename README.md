# ReviewIQ 📊
### AI-powered review intelligence that turns customer feedback into business growth

> **Blueprint Hackathon 2025** — Built in 14 days

---

## What It Does

ReviewIQ helps businesses understand what their customers *actually* think — and what to do about it.

Enter any business name → ReviewIQ pulls their Google reviews, runs AI analysis, and delivers:

- **Ranked issue list** — problems sorted by priority, with specific AI-generated solutions
- **Competitor benchmarking** — side-by-side comparison with local competitors
- **AI review replies** — three personality modes: professional, empathetic, direct
- **Trend graphs** — red line (issues/rating over time), green line (positive sentiment)
- **Recurring keyword detection** — word frequency analysis across positive/negative reviews
- **Automated alerts** — triggered when the same issue appears in 3+ recent reviews
- **Weekly insight reports** — AI-generated business health summaries

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React)                  │
│  Vite + Recharts + Tailwind-style inline CSS         │
│  Search → Dashboard → Tabs (Overview/Issues/         │
│           Trends/Competitors/Replies/Reports)        │
└───────────────────────┬─────────────────────────────┘
                        │ HTTP / REST
┌───────────────────────▼─────────────────────────────┐
│                   Backend (FastAPI)                  │
│                                                      │
│  /api/reviews/search  →  Google Places API           │
│                           └→ SerpApi (fallback)      │
│                               └→ Demo data (always)  │
│                                                      │
│  /api/analysis/analyze →  Claude claude-sonnet-4-6  │
│  /api/replies/generate →  Claude claude-sonnet-4-6  │
│  /api/analysis/report  →  Claude claude-sonnet-4-6  │
│  /api/competitors/compare → Demo/cached data         │
└─────────────────────────────────────────────────────┘
```

**Three-tier fallback** on every data source: live API → secondary API → demo data. Nothing can break on stage.

---

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- API keys (see `.env.example` — app works without them using demo data)

### Backend

```bash
cd backend
pip install -r requirements.txt

# Copy and fill in your keys (or leave blank for demo mode)
cp .env.example .env

python main.py
# → running on http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → running on http://localhost:3000
```

Then open **http://localhost:3000** and search for "The Golden Fork" to see the full demo.

---

## Environment Variables

```env
ANTHROPIC_API_KEY=       # Required for AI analysis and replies
GOOGLE_PLACES_API_KEY=   # Optional: enables live business search
SERPAPI_KEY=             # Optional: richer review data (20+ reviews)
```

The app runs in **demo mode** with no keys — all features work with pre-seeded data.

---

## Deployment

### Frontend → Vercel
```bash
cd frontend
npm run build
# Deploy /dist to Vercel — one click
```

### Backend → Railway
```bash
# Connect GitHub repo to Railway
# Set environment variables in Railway dashboard
# Railway auto-detects FastAPI and deploys
```

Or use the included `Procfile`:
```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/reviews/search?q=<query>` | Search for a business and fetch reviews |
| `POST` | `/api/analysis/analyze` | Run AI analysis on a set of reviews |
| `POST` | `/api/replies/generate` | Generate a review reply with personality |
| `GET` | `/api/competitors/compare?business=<name>` | Fetch competitor benchmarking data |
| `POST` | `/api/analysis/report` | Generate a weekly insight report |

All endpoints return `{"success": true, "data": {...}}` or `{"success": false, "detail": "..."}`.

---

## Feature Deep Dive

### Issue Prioritization
Claude analyzes all reviews and ranks issues by:
1. **Frequency** — how many reviews mention it
2. **Severity** — critical / high / medium / low
3. **Category** — service, food, ambiance, wait time, cleanliness, etc.

Each issue includes a direct quote, a specific solution (not generic advice), and links to the AI reply generator.

### Competitor Benchmarking
Compares your business across:
- Star rating
- Review volume
- Positive sentiment percentage
- Radar chart visualization of relative strengths

### AI Reply Personalities
- **Professional**: Brand-polished, uses "we", PR-trained tone
- **Empathetic**: Warm and personal, feelings-first response
- **Direct**: 3-4 sentences, solution-forward, no fluff

### Trend Graphs
- 🔴 **Red line**: Average star rating per month (goes up as issues are resolved)
- 🟢 **Green line**: Percentage of positive reviews per month
- 📊 **Bar chart**: Review volume by month (engagement metric)

### Automated Alerts
Triggered when the same issue (keyword cluster) appears in 3+ reviews within a short time window. Shown as a prominent banner on the dashboard.

---

## Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| Frontend | React 18 + Vite | Fast, familiar, great DX |
| Charts | Recharts | Best React charting library, zero config |
| Backend | FastAPI (Python) | Async, auto-docs, fast to write |
| AI | Claude claude-sonnet-4-6 | Best instruction-following for structured JSON |
| Reviews | Google Places API + SerpApi | Two-source redundancy |
| Deploy | Vercel + Railway | One-click, free tier, zero DevOps |

---

## Project Structure

```
reviewiq/
├── backend/
│   ├── main.py                    # FastAPI app, CORS, route registration
│   ├── requirements.txt
│   ├── .env.example
│   ├── routes/
│   │   ├── reviews.py             # Business search endpoint
│   │   ├── analysis.py            # AI analysis + reports
│   │   ├── replies.py             # Review reply generation
│   │   └── competitors.py         # Competitor comparison
│   └── services/
│       ├── review_service.py      # Google Places + SerpApi + fallback
│       ├── ai_service.py          # Claude integration + fallback logic
│       └── demo_data.py           # Always-available seed data
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx               # React entry point
        └── App.jsx                # Complete single-file app
```

---

## If We Had More Time

1. **Email/SMS alerts** — send push notifications when the same issue appears in 3+ reviews in a week (Twilio + SendGrid integration is ~2 hours of work)

2. **Predictive modeling** — train a simple regression model on review trends to project future ratings if issues are/aren't addressed

3. **Monthly growth page** — month-over-month comparison with percentage deltas and a "this month's story" narrative AI summary

---

## Team

Built at Blueprint Hackathon 2025 by a team of 4.

---

## License

MIT — feel free to build on this.
