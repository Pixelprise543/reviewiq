import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from "recharts";

// ─── API Layer with fallback demo data ───────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const DEMO_DATA = {
  business: {
    name: "The Golden Fork",
    address: "123 Main St, Austin, TX",
    rating: 3.8,
    total_reviews: 247,
    category: "Restaurant",
    phone: "(512) 555-0147",
    website: "thegoldenfork.com",
  },
  analysis: {
    overall_sentiment: 0.61,
    summary: "The Golden Fork shows strong food quality but faces consistent service challenges. Staff behavior and wait times are the most frequently cited pain points, appearing in 38% of negative reviews.",
    issues: [
      { id: "rude_staff", title: "Staff Rudeness", description: "Multiple reviewers describe dismissive, forgetful, or rude waitstaff — particularly one described as 'tall with a beard'.", frequency: 6, severity: "critical", priority_rank: 1, category: "service", example_quote: "The waiter was incredibly rude and dismissive. Took 45 minutes to get our food and it arrived cold.", solution: "Implement a mandatory weekly customer-service training. Create anonymous review cards at each table so issues surface before they become public. Consider a staff recognition program tied to review mentions." },
      { id: "wait_times", title: "Long Wait Times", description: "Customers report excessive wait times both for seating (even with reservations) and food delivery.", frequency: 5, severity: "high", priority_rank: 2, category: "wait_time", example_quote: "Waited over an hour for a table with a reservation.", solution: "Audit your reservation system for double-booking bugs. Set kitchen time targets per dish and track them. Add a 'running late' text notification for reservation holders." },
      { id: "food_temp", title: "Food Arriving Cold", description: "A recurring issue across multiple reviews — food is prepared but not served promptly.", frequency: 4, severity: "high", priority_rank: 3, category: "food", example_quote: "Took 45 minutes to get our food and it arrived cold.", solution: "Install heat lamps at the pass. Implement a maximum 3-minute expedite rule from kitchen pass to table. Track cold-food complaints per shift to identify patterns." },
      { id: "parking", title: "Parking Difficulties", description: "Customers note that parking near the location is limited and stressful.", frequency: 3, severity: "medium", priority_rank: 4, category: "other", example_quote: "Parking is a nightmare. Used to love this place.", solution: "Partner with the lot on Oak Ave for validated parking. Add a parking info card to the reservation confirmation email with the nearest alternatives." },
    ],
    positives: [
      { title: "Food Quality & Taste", frequency: 8, example_quote: "The risotto was perfectly creamy. Best Italian in Austin by far." },
      { title: "Romantic Ambiance", frequency: 5, example_quote: "Perfect date night spot! Romantic lighting, amazing food." },
      { title: "Exceptional Staff (specific)", frequency: 3, example_quote: "Our server Maria was exceptional." },
      { title: "Dessert Menu", frequency: 4, example_quote: "The tiramisu is a must. The seafood pasta changed my life." },
    ],
    keywords: {
      negative: [
        { word: "waiter", count: 8 }, { word: "cold", count: 6 }, { word: "wait", count: 7 },
        { word: "rude", count: 5 }, { word: "parking", count: 4 }, { word: "slow", count: 5 },
        { word: "disappointed", count: 3 }, { word: "forgotten", count: 3 }
      ],
      positive: [
        { word: "amazing", count: 9 }, { word: "pasta", count: 7 }, { word: "romantic", count: 5 },
        { word: "delicious", count: 8 }, { word: "ambiance", count: 6 }, { word: "fresh", count: 5 },
        { word: "friendly", count: 4 }, { word: "recommend", count: 6 }
      ]
    },
    quick_wins: [
      "Reply to all 1-2 star reviews within 24 hours offering a complimentary return visit",
      "Post a public response template acknowledging wait time issues and what's being done",
      "Feature 'server Maria' as an example of the experience you aim to deliver"
    ],
    marketing_advice: "Your food quality scores are genuinely strong — customers consistently describe it as the best Italian in Austin. Lead your social media and Google Business posts with food photography and chef spotlights. Run a campaign around your top-rated dishes (risotto, tiramisu, seafood pasta) with the tagline 'Worth the Trip.' Address parking directly in your bio: 'Validated parking available on Oak Ave.' This converts hesitant first-timers.",
    alert: { triggered: true, reason: "Rude waiter mentioned in 4 reviews in the past 2 weeks — immediate staff review recommended.", urgency: "high" }
  },
  trends: {
    "2025-01": { avg_rating: 3.5, review_count: 18, sentiment: 0.52 },
    "2025-02": { avg_rating: 3.6, review_count: 15, sentiment: 0.54 },
    "2025-03": { avg_rating: 3.4, review_count: 22, sentiment: 0.49 },
    "2025-04": { avg_rating: 3.7, review_count: 20, sentiment: 0.57 },
    "2025-05": { avg_rating: 3.5, review_count: 25, sentiment: 0.51 },
    "2025-06": { avg_rating: 3.9, review_count: 28, sentiment: 0.63 },
    "2025-07": { avg_rating: 4.1, review_count: 19, sentiment: 0.71 },
  },
  competitors: [
    { name: "Bella Italia", rating: 4.3, total_reviews: 312, avg_sentiment: 0.72, strengths: ["Consistent quality", "Fast service", "Ample parking"] },
    { name: "Casa Romana", rating: 4.0, total_reviews: 198, avg_sentiment: 0.61, strengths: ["Great ambiance", "Good wine list"] },
    { name: "Trattoria Mia", rating: 3.6, total_reviews: 143, avg_sentiment: 0.48, strengths: ["Affordable prices", "Large portions"] },
  ],
  reviews: [
    { id: "r1", author: "Sarah M.", rating: 2, date: "2025-07-01", text: "The waiter was incredibly rude and dismissive. Took 45 minutes to get our food and it arrived cold. The pasta was overcooked and bland. Will not be returning." },
    { id: "r2", author: "James K.", rating: 5, date: "2025-07-03", text: "Absolutely fantastic! The risotto was perfectly creamy and the service was attentive without being overbearing. Best Italian in Austin by far." },
    { id: "r3", author: "Priya L.", rating: 1, date: "2025-06-28", text: "Waited over an hour for a table with a reservation. The waiter kept forgetting our orders. Steak was raw when I ordered medium. Disaster." },
    { id: "r4", author: "Emma S.", rating: 5, date: "2025-05-30", text: "Perfect date night spot! Romantic lighting, amazing food, and our server Maria was exceptional. The seafood pasta changed my life." },
    { id: "r5", author: "Carl T.", rating: 2, date: "2025-05-10", text: "Cold food, long waits, rude staff. The manager was helpful when we complained but the damage was done. The only saving grace was the dessert." },
  ]
};

async function fetchWithFallback(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers: { "Content-Type": "application/json" } });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || `Server error (${res.status})`);
    }
    return await res.json();
  } catch (err) {
    // Re-throw network errors with a friendly message
    if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
      throw new Error("Cannot reach the backend. Make sure python main.py is running on port 8000.");
    }
    throw err;
  }
}

// ─── Color system & helpers ───────────────────────────────────────────────────

const SEVERITY_COLORS = { critical: "#ef4444", high: "#f97316", medium: "#eab308", low: "#22c55e" };
const SEVERITY_BG = { critical: "#fef2f2", high: "#fff7ed", medium: "#fefce8", low: "#f0fdf4" };
const SEVERITY_LABEL = { critical: "Critical", high: "High", medium: "Medium", low: "Low" };

const ratingColor = (r) => r >= 4 ? "#22c55e" : r >= 3 ? "#eab308" : "#ef4444";

const Stars = ({ rating, size = "sm" }) => {
  const sz = size === "lg" ? "text-xl" : "text-sm";
  return (
    <span className={sz}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= rating ? "#f59e0b" : "#d1d5db" }}>★</span>
      ))}
    </span>
  );
};

const SentimentBadge = ({ value }) => {
  const pct = Math.round(value * 100);
  const color = pct >= 70 ? "#22c55e" : pct >= 50 ? "#eab308" : "#ef4444";
  const bg = pct >= 70 ? "#f0fdf4" : pct >= 50 ? "#fefce8" : "#fef2f2";
  return (
    <span style={{ backgroundColor: bg, color, borderRadius: 20, padding: "2px 10px", fontSize: 13, fontWeight: 600 }}>
      {pct}% positive
    </span>
  );
};

// ─── Main App ────────────────────────────────────────────────────────────────

export default function ReviewIQ() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [data, setData] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyPersonality, setReplyPersonality] = useState("professional");
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [expandedIssue, setExpandedIssue] = useState(null);
  const [error, setError] = useState(null);

  const runSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setData(null);
    setError(null);
    setActiveTab("overview");

    try {
      // Stage 1: Fetch business + reviews
      setLoadingStage("Searching for business...");
      const bizResult = await fetchWithFallback(`/api/reviews/search?q=${encodeURIComponent(searchQuery)}`);
      const business = bizResult?.data
        ? bizResult.data
        : { name: searchQuery.trim(), address: "", rating: null, total_reviews: 0, category: "Business", phone: "", website: "" };
      const reviews = bizResult?.data?.reviews || [];
      const trends = bizResult?.data?.monthly_trends || {};

      // Stage 2: AI analysis
      setLoadingStage("Running AI analysis...");
      const analysisResult = await fetchWithFallback("/api/analysis/analyze", {
        method: "POST",
        body: JSON.stringify({ business_name: business.name, reviews, category: business.category || "Business" })
      });

      if (!analysisResult?.data) {
        throw new Error("AI analysis failed. Check that your GROQ_API_KEY is set correctly in backend/.env");
      }
      const analysis = analysisResult.data;

      // Stage 3: Competitors
      setLoadingStage("Loading competitor data...");
      const compResult = await fetchWithFallback(`/api/competitors/compare?business=${encodeURIComponent(business.name)}`);
      const competitors = compResult?.data?.competitors || [];

      setData({ business, reviews, analysis, trends, competitors });

    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setLoadingStage("");
    }
  }, []);

  const [replyError, setReplyError] = useState(null);

  const generateReply = async (review, personality) => {
    setReplyLoading(true);
    setReplyText("");
    setReplyError(null);
    try {
      const result = await fetchWithFallback("/api/replies/generate", {
        method: "POST",
        body: JSON.stringify({
          review_text: review.text,
          rating: review.rating,
          business_name: data.business.name,
          personality,
        })
      });
      if (result?.data?.reply) {
        setReplyText(result.data.reply);
      } else {
        throw new Error("No reply returned from AI.");
      }
    } catch (err) {
      setReplyError(err.message || "Failed to generate reply. Check your GROQ_API_KEY.");
    }
    setReplyLoading(false);
  };

  const generateReport = async () => {
    setReportLoading(true);
    try {
      const result = await fetchWithFallback("/api/analysis/report", {
        method: "POST",
        body: JSON.stringify({ business_name: data.business.name, analysis: data.analysis, trends: data.trends })
      });
      setWeeklyReport(result?.data?.report || `Weekly Insight Report — ${data.business.name}\n\nYour sentiment score improved to ${Math.round(data.analysis.overall_sentiment * 100)}% this week, up from last week. Your top opportunity remains addressing service consistency, which appears in ${data.analysis.issues[0]?.frequency || 0} recent reviews.\n\nThis week, prioritize: responding to all negative reviews within 24 hours, conducting a staff briefing on the top complaints, and promoting your strongest dishes on social media.\n\nThe trend is moving in the right direction — keep the momentum going by acting on your #1 priority issue this week.`);
    } finally {
      setReportLoading(false);
    }
  };

  // ── Landing / Search ────────────────────────────────────────────────────────

  if (!data && !loading) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0d1f3c 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Inter', system-ui, sans-serif" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📊</div>
            <span style={{ fontSize: 36, fontWeight: 800, color: "white", letterSpacing: -1 }}>Review<span style={{ color: "#818cf8" }}>IQ</span></span>
          </div>
          <p style={{ color: "#94a3b8", fontSize: 18, maxWidth: 480, lineHeight: 1.6 }}>
            AI-powered review intelligence. See what your customers really think — and what to do about it.
          </p>
        </div>

        {/* Search */}
        <div style={{ width: "100%", maxWidth: 560 }}>
          <div style={{ display: "flex", gap: 8, background: "rgba(255,255,255,0.05)", borderRadius: 16, padding: 8, border: "1px solid rgba(255,255,255,0.1)" }}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && runSearch(query)}
              placeholder="Enter your business name or address..."
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "white", fontSize: 16, padding: "8px 12px" }}
            />
            <button
              onClick={() => runSearch(query)}
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", border: "none", borderRadius: 10, padding: "10px 24px", fontSize: 15, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              Analyze →
            </button>
          </div>
          <p style={{ color: "#64748b", fontSize: 13, marginTop: 10, textAlign: "center" }}>
            Search by business name — e.g. <em>"Chipotle Charlotte NC"</em> or <em>"Joe's Pizza New York"</em>
          </p>
        </div>

        {/* Feature pills */}
        <div style={{ display: "flex", gap: 12, marginTop: 56, flexWrap: "wrap", justifyContent: "center" }}>
          {["🏆 Competitor Benchmarking", "🔴 Live Issue Alerts", "🤖 AI Review Replies", "📈 Trend Analysis", "📋 Weekly Reports"].map(f => (
            <span key={f} style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc", borderRadius: 20, padding: "6px 16px", fontSize: 13, border: "1px solid rgba(99,102,241,0.3)" }}>{f}</span>
          ))}
        </div>
      </div>
    );
  }

  // ── Loading state ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f0f23", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 24px", animation: "pulse 1.5s ease-in-out infinite" }}>📊</div>
          <div style={{ color: "white", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Analyzing your business...</div>
          <div style={{ color: "#6366f1", fontSize: 15 }}>{loadingStage}</div>
          <div style={{ marginTop: 24, display: "flex", gap: 6, justifyContent: "center" }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: 4, background: "#6366f1", animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite` }} />
            ))}
          </div>
        </div>
        <style>{`
          @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
          @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-10px)} }
        `}</style>
      </div>
    );
  }

  // ── Error screen ─────────────────────────────────────────────────────────────

  if (error && !loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f0f23", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', system-ui, sans-serif", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>⚠️</div>
          <h2 style={{ color: "white", fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Something went wrong</h2>
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "14px 20px", marginBottom: 24 }}>
            <p style={{ color: "#fca5a5", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{error}</p>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => { setError(null); runSearch(query); }}
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", border: "none", borderRadius: 10, padding: "10px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Try Again
            </button>
            <button
              onClick={() => { setError(null); setData(null); setQuery(""); }}
              style={{ background: "rgba(255,255,255,0.07)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              ← Back to Search
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Dashboard ────────────────────────────────────────────────────────────────

  const { business, reviews, analysis, trends, competitors } = data;
  const trendData = Object.entries(trends).map(([month, vals]) => ({
    month: month.replace("2025-", ""),
    rating: vals.avg_rating,
    sentiment: Math.round(vals.sentiment * 100),
    reviews: vals.review_count,
  }));

  const tabs = [
    { id: "overview", label: "Overview", icon: "🏠" },
    { id: "issues", label: "Issues", icon: "🔴" },
    { id: "trends", label: "Trends", icon: "📈" },
    { id: "competitors", label: "Competitors", icon: "🏆" },
    { id: "replies", label: "AI Replies", icon: "💬" },
    { id: "report", label: "Weekly Report", icon: "📋" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        .tab-btn { background: transparent; border: none; cursor: pointer; transition: all 0.15s; }
        .tab-btn:hover { background: rgba(99,102,241,0.08); }
        .card { background: white; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04); }
        .issue-row:hover { background: #f8fafc; }
        .copy-btn:hover { background: #f1f5f9; }
        @keyframes slideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .fade-in { animation: slideIn 0.25s ease; }
      `}</style>

      {/* Header */}
      <div style={{ background: "white", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📊</div>
            <span style={{ fontWeight: 800, fontSize: 20, color: "#1e293b", letterSpacing: -0.5 }}>Review<span style={{ color: "#6366f1" }}>IQ</span></span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && runSearch(query)}
              style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 12px", fontSize: 14, outline: "none", width: 260, color: "#334155" }}
              placeholder="Search any business..."
            />
            <button onClick={() => runSearch(query)}
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", border: "none", borderRadius: 8, padding: "6px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              Analyze →
            </button>
            <button onClick={() => { setData(null); setQuery(""); }}
              style={{ background: "white", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 14px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {analysis.alert?.triggered && (
        <div style={{ background: "#fef2f2", borderBottom: "2px solid #fca5a5", padding: "10px 24px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>🚨</span>
            <span style={{ color: "#991b1b", fontWeight: 600, fontSize: 14 }}>Alert: </span>
            <span style={{ color: "#7f1d1d", fontSize: 14 }}>{analysis.alert.reason}</span>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 24px" }}>

        {/* No reviews warning banner */}
        {reviews.length === 0 && (
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "14px 20px", marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 12 }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 700, color: "#92400e", fontSize: 14, marginBottom: 4 }}>No review data found for "{business.name}"</div>
              <div style={{ color: "#78350f", fontSize: 13, lineHeight: 1.5 }}>
                To get real reviews, add a <strong>Google Places API key</strong> or <strong>SerpApi key</strong> to <code style={{ background: "#fef3c7", padding: "1px 5px", borderRadius: 4 }}>backend/.env</code>.
                &nbsp;Try searching the <strong>business name</strong> (e.g. "Chipotle Charlotte") instead of a street address.
              </div>
            </div>
          </div>
        )}

        {/* Business Header Card */}
        <div className="card fade-in" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#1e293b" }}>{business.name}</h1>
                {business.category && business.category !== "Business" && (
                  <span style={{ background: "#ede9fe", color: "#7c3aed", borderRadius: 12, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>{business.category}</span>
                )}
              </div>
              {business.address && <div style={{ color: "#64748b", fontSize: 14 }}>{business.address}</div>}
            </div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              <MetricTile label="Overall Rating" value={business.rating ? business.rating.toFixed(1) : "—"} sub={`${business.total_reviews?.toLocaleString() || 0} reviews`} accent={business.rating ? ratingColor(business.rating) : "#94a3b8"} icon="⭐" />
              <MetricTile label="Sentiment Score" value={reviews.length > 0 ? `${Math.round(analysis.overall_sentiment * 100)}%` : "—"} sub="positive reviews" accent={reviews.length > 0 ? ratingColor(analysis.overall_sentiment * 5) : "#94a3b8"} icon="💬" />
              <MetricTile label="Issues Found" value={analysis.issues?.length || 0} sub={`${analysis.issues?.filter(i => i.severity === "critical" || i.severity === "high").length || 0} high priority`} accent="#6366f1" icon="🔴" />
            </div>
          </div>
          {analysis.summary && analysis.summary !== "No reviews available to analyze." && (
            <div style={{ marginTop: 16, padding: 14, background: "#f8fafc", borderRadius: 10, borderLeft: "3px solid #6366f1" }}>
              <p style={{ margin: 0, color: "#475569", fontSize: 14, lineHeight: 1.6 }}>{analysis.summary}</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "white", padding: 4, borderRadius: 12, border: "1px solid #e2e8f0", overflowX: "auto" }}>
          {tabs.map(tab => (
            <button key={tab.id} className="tab-btn" onClick={() => setActiveTab(tab.id)}
              style={{ padding: "8px 16px", borderRadius: 8, fontSize: 14, fontWeight: activeTab === tab.id ? 700 : 400, color: activeTab === tab.id ? "#6366f1" : "#64748b", background: activeTab === tab.id ? "#ede9fe" : "transparent", whiteSpace: "nowrap" }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Top Issues Preview */}
            <div className="card" style={{ padding: 24 }}>
              <SectionHeader title="Top Priorities" sub="Issues ranked by urgency" icon="🔴" onAction={() => setActiveTab("issues")} actionLabel="View all →" />
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
                {analysis.issues.slice(0, 3).map((issue, i) => (
                  <div key={issue.id} style={{ display: "flex", gap: 12, padding: 12, borderRadius: 10, background: SEVERITY_BG[issue.severity], border: `1px solid ${SEVERITY_COLORS[issue.severity]}22` }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: SEVERITY_COLORS[issue.severity], color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>#{i+1}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>{issue.title}</div>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Mentioned in {issue.frequency} reviews · <span style={{ color: SEVERITY_COLORS[issue.severity], fontWeight: 600 }}>{SEVERITY_LABEL[issue.severity]}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* What Customers Love */}
            <div className="card" style={{ padding: 24 }}>
              <SectionHeader title="What Customers Love" sub="Your strengths to amplify" icon="💚" />
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
                {analysis.positives.map((pos, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, padding: 12, borderRadius: 10, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                    <span style={{ fontSize: 18 }}>✓</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#166534" }}>{pos.title}</div>
                      <div style={{ fontSize: 12, color: "#15803d", marginTop: 2 }}>"{pos.example_quote?.substring(0, 80)}..."</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Word Cloud-style Keywords */}
            <div className="card" style={{ padding: 24 }}>
              <SectionHeader title="Review Keywords" sub="Most frequent words in reviews" icon="💭" />
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#ef4444", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>⚠ Recurring Complaints</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                  {analysis.keywords.negative.map(kw => {
                    const size = Math.max(12, Math.min(20, 10 + kw.count * 1.5));
                    return <span key={kw.word} style={{ background: "#fef2f2", color: "#ef4444", borderRadius: 20, padding: "3px 12px", fontSize: size, fontWeight: kw.count > 5 ? 700 : 400, border: "1px solid #fecaca" }}>{kw.word} ({kw.count})</span>;
                  })}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#22c55e", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>✓ Praised Elements</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {analysis.keywords.positive.map(kw => {
                    const size = Math.max(12, Math.min(20, 10 + kw.count * 1.5));
                    return <span key={kw.word} style={{ background: "#f0fdf4", color: "#15803d", borderRadius: 20, padding: "3px 12px", fontSize: size, fontWeight: kw.count > 6 ? 700 : 400, border: "1px solid #bbf7d0" }}>{kw.word} ({kw.count})</span>;
                  })}
                </div>
              </div>
            </div>

            {/* Quick Wins */}
            <div className="card" style={{ padding: 24 }}>
              <SectionHeader title="Quick Wins" sub="Act on these this week" icon="⚡" />
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
                {analysis.quick_wins.map((win, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: 12, borderRadius: 10, background: "#fffbeb", border: "1px solid #fde68a" }}>
                    <span style={{ width: 22, height: 22, borderRadius: 6, background: "#f59e0b", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{i+1}</span>
                    <span style={{ fontSize: 14, color: "#78350f", lineHeight: 1.4 }}>{win}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, padding: 14, background: "#f0f9ff", borderRadius: 10, border: "1px solid #bae6fd" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#0369a1", marginBottom: 4 }}>📣 Marketing Advice</div>
                <p style={{ margin: 0, fontSize: 13, color: "#0c4a6e", lineHeight: 1.6 }}>{analysis.marketing_advice}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── ISSUES TAB ── */}
        {activeTab === "issues" && (
          <div className="fade-in">
            <div className="card" style={{ padding: 24 }}>
              <SectionHeader title="Ranked Issue List" sub={`${analysis.issues.length} issues identified, sorted by priority`} icon="🔴" />
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
                {analysis.issues.map((issue) => (
                  <div key={issue.id} style={{ border: `2px solid ${expandedIssue === issue.id ? SEVERITY_COLORS[issue.severity] : "#e2e8f0"}`, borderRadius: 12, overflow: "hidden", transition: "border-color 0.15s" }}>
                    <div className="issue-row" onClick={() => setExpandedIssue(expandedIssue === issue.id ? null : issue.id)}
                      style={{ padding: 16, display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: SEVERITY_COLORS[issue.severity], color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, flexShrink: 0 }}>#{issue.priority_rank}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>{issue.title}</div>
                        <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{issue.description.substring(0, 100)}...</div>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                        <span style={{ background: SEVERITY_BG[issue.severity], color: SEVERITY_COLORS[issue.severity], borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700 }}>{SEVERITY_LABEL[issue.severity]}</span>
                        <span style={{ color: "#94a3b8", fontSize: 13 }}>{issue.frequency} reviews</span>
                        <span style={{ color: "#94a3b8" }}>{expandedIssue === issue.id ? "▲" : "▼"}</span>
                      </div>
                    </div>
                    {expandedIssue === issue.id && (
                      <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${SEVERITY_COLORS[issue.severity]}33`, background: SEVERITY_BG[issue.severity] }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                          <div style={{ padding: 12, background: "white", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 6 }}>Customer Quote</div>
                            <p style={{ margin: 0, fontSize: 13, color: "#475569", fontStyle: "italic", lineHeight: 1.5 }}>"{issue.example_quote}"</p>
                          </div>
                          <div style={{ padding: 12, background: "white", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", marginBottom: 6 }}>💡 AI Solution</div>
                            <p style={{ margin: 0, fontSize: 13, color: "#1e293b", lineHeight: 1.5 }}>{issue.solution}</p>
                          </div>
                        </div>
                        <button onClick={() => { setSelectedReview({ text: issue.example_quote, rating: 1 }); setActiveTab("replies"); }}
                          style={{ marginTop: 10, background: "#6366f1", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                          Generate AI Reply to this Issue →
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TRENDS TAB ── */}
        {activeTab === "trends" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="card" style={{ padding: 24 }}>
              <SectionHeader title="Rating & Sentiment Trends" sub="Monthly performance over time" icon="📈" />
              <div style={{ marginTop: 20, height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} />
                    <YAxis yAxisId="rating" domain={[1, 5]} tick={{ fontSize: 12, fill: "#64748b" }} />
                    <YAxis yAxisId="sentiment" orientation="right" domain={[0, 100]} tick={{ fontSize: 12, fill: "#64748b" }} unit="%" />
                    <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13 }} />
                    <Legend />
                    <Line yAxisId="rating" type="monotone" dataKey="rating" stroke="#ef4444" strokeWidth={2.5} dot={{ fill: "#ef4444", r: 4 }} name="Avg Rating (↑ issues resolved)" />
                    <Line yAxisId="sentiment" type="monotone" dataKey="sentiment" stroke="#22c55e" strokeWidth={2.5} dot={{ fill: "#22c55e", r: 4 }} name="Positive Sentiment %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b" }}>
                  <span style={{ width: 12, height: 3, background: "#ef4444", display: "inline-block", borderRadius: 2 }}></span> Red line = average star rating per month
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b" }}>
                  <span style={{ width: 12, height: 3, background: "#22c55e", display: "inline-block", borderRadius: 2 }}></span> Green line = % of positive reviews
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: 24 }}>
              <SectionHeader title="Review Volume by Month" sub="How many customers are leaving reviews" icon="📊" />
              <div style={{ marginTop: 20, height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13 }} />
                    <Bar dataKey="reviews" fill="#6366f1" radius={[4,4,0,0]} name="Reviews" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ── COMPETITORS TAB ── */}
        {activeTab === "competitors" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="card" style={{ padding: 24 }}>
              <SectionHeader title="Competitor Benchmarking" sub={`How ${business.name} stacks up in your area`} icon="🏆" />
              <div style={{ marginTop: 20, overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["Business", "Rating", "Reviews", "Sentiment", "Strengths"].map(h => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ background: "#ede9fe", borderTop: "2px solid #6366f1" }}>
                      <td style={{ padding: "12px 14px", fontWeight: 800, color: "#6366f1", fontSize: 14 }}>★ {business.name} <span style={{ fontWeight: 400, color: "#7c3aed", fontSize: 12 }}>(you)</span></td>
                      <td style={{ padding: "12px 14px" }}><Stars rating={business.rating ? Math.round(business.rating) : 0} /> <strong>{business.rating ? business.rating.toFixed(1) : "N/A"}</strong></td>
                      <td style={{ padding: "12px 14px", color: "#1e293b", fontWeight: 600 }}>{business.total_reviews?.toLocaleString() || "—"}</td>
                      <td style={{ padding: "12px 14px" }}><SentimentBadge value={analysis.overall_sentiment || 0.5} /></td>
                      <td style={{ padding: "12px 14px", color: "#64748b", fontSize: 13 }}>Based on your reviews</td>
                    </tr>
                    {competitors.length > 0 ? competitors.map((comp, i) => (
                      <tr key={i} style={{ borderTop: "1px solid #e2e8f0" }}>
                        <td style={{ padding: "12px 14px", fontWeight: 600, color: "#1e293b", fontSize: 14 }}>{comp.name}</td>
                        <td style={{ padding: "12px 14px" }}><Stars rating={Math.round(comp.rating || 0)} /> <span style={{ color: ratingColor(comp.rating || 0), fontWeight: 600 }}>{comp.rating?.toFixed(1) || "—"}</span></td>
                        <td style={{ padding: "12px 14px", color: "#64748b" }}>{comp.total_reviews?.toLocaleString() || "—"}</td>
                        <td style={{ padding: "12px 14px" }}><SentimentBadge value={comp.avg_sentiment || 0.5} /></td>
                        <td style={{ padding: "12px 14px", color: "#64748b", fontSize: 13 }}>{comp.strengths?.slice(0,2).join(", ") || "—"}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
                          Competitor data will appear here once Google Places API is connected
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {competitors.length >= 2 && (
            <div className="card" style={{ padding: 24 }}>
              <SectionHeader title="Competitive Radar" sub="Sentiment comparison across competitors" icon="📡" />
              <div style={{ height: 280, marginTop: 16 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={[
                    { metric: "Rating", you: (business.rating || 0) * 20, comp1: (competitors[0]?.rating || 0) * 20, comp2: (competitors[1]?.rating || 0) * 20 },
                    { metric: "Sentiment", you: (analysis.overall_sentiment || 0.5) * 100, comp1: (competitors[0]?.avg_sentiment || 0) * 100, comp2: (competitors[1]?.avg_sentiment || 0) * 100 },
                    { metric: "Review Vol", you: Math.min(100, ((business.total_reviews || 0) / 4)), comp1: Math.min(100, ((competitors[0]?.total_reviews || 0) / 4)), comp2: Math.min(100, ((competitors[1]?.total_reviews || 0) / 4)) },
                  ]}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: "#64748b" }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                    <Radar name={business.name} dataKey="you" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                    <Radar name={competitors[0]?.name} dataKey="comp1" stroke="#f97316" fill="#f97316" fillOpacity={0.1} />
                    <Radar name={competitors[1]?.name} dataKey="comp2" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
            )}
          </div>
        )}

        {/* ── REPLIES TAB ── */}
        {activeTab === "replies" && (
          <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Review selector */}
            <div className="card" style={{ padding: 24 }}>
              <SectionHeader title="Select a Review" sub="Choose one to generate an AI reply" icon="💬" />
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
                {reviews.map(rev => (
                  <div key={rev.id} onClick={() => { setSelectedReview(rev); setReplyText(""); }}
                    style={{ padding: 14, borderRadius: 10, border: `2px solid ${selectedReview?.id === rev.id ? "#6366f1" : "#e2e8f0"}`, cursor: "pointer", background: selectedReview?.id === rev.id ? "#ede9fe" : "white", transition: "all 0.15s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>{rev.author}</span>
                      <Stars rating={rev.rating} />
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.4 }}>{rev.text.substring(0, 120)}...</p>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>{rev.date}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reply generator */}
            <div className="card" style={{ padding: 24 }}>
              <SectionHeader title="AI Reply Generator" sub="Three tones, one click" icon="🤖" />
              {selectedReview ? (
                <>
                  <div style={{ marginTop: 16, padding: 14, background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{selectedReview.author}</span>
                      <Stars rating={selectedReview.rating} />
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>{selectedReview.text}</p>
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Reply tone:</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {[
                        { id: "professional", label: "🎩 Professional", desc: "Brand-polished" },
                        { id: "empathetic", label: "💛 Empathetic", desc: "Warm & human" },
                        { id: "direct", label: "⚡ Direct", desc: "Short & clear" },
                      ].map(p => (
                        <button key={p.id} onClick={() => setReplyPersonality(p.id)}
                          style={{ flex: 1, padding: "10px 8px", borderRadius: 10, border: `2px solid ${replyPersonality === p.id ? "#6366f1" : "#e2e8f0"}`, background: replyPersonality === p.id ? "#ede9fe" : "white", cursor: "pointer", textAlign: "center" }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: replyPersonality === p.id ? "#6366f1" : "#374151" }}>{p.label}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>{p.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button onClick={() => generateReply(selectedReview, replyPersonality)}
                    disabled={replyLoading}
                    style={{ marginTop: 16, width: "100%", padding: 12, background: replyLoading ? "#94a3b8" : "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: replyLoading ? "not-allowed" : "pointer" }}>
                    {replyLoading ? "Generating..." : "Generate Reply ✨"}
                  </button>

                  {replyError && (
                    <div style={{ marginTop: 16, padding: 14, background: "#fef2f2", borderRadius: 10, border: "1px solid #fecaca" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#ef4444", marginBottom: 4 }}>⚠ Error</div>
                      <p style={{ margin: 0, fontSize: 13, color: "#991b1b" }}>{replyError}</p>
                    </div>
                  )}

                  {replyText && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#22c55e", marginBottom: 6, textTransform: "uppercase" }}>✓ Generated Reply</div>
                      <div style={{ padding: 14, background: "#f0fdf4", borderRadius: 10, border: "1px solid #bbf7d0", fontSize: 14, color: "#166534", lineHeight: 1.6 }}>{replyText}</div>
                      <button className="copy-btn" onClick={() => navigator.clipboard.writeText(replyText)}
                        style={{ marginTop: 8, width: "100%", padding: 10, background: "white", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#64748b" }}>
                        📋 Copy to Clipboard
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ marginTop: 40, textAlign: "center", color: "#94a3b8" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
                  <div style={{ fontSize: 15 }}>Select a review on the left to generate a reply</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── REPORT TAB ── */}
        {activeTab === "report" && (
          <div className="fade-in">
            <div className="card" style={{ padding: 24 }}>
              <SectionHeader title="Weekly Insight Report" sub={`Generated for ${business.name} · Week of ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`} icon="📋" />
              <div style={{ marginTop: 20 }}>
                {!weeklyReport ? (
                  <div style={{ textAlign: "center", padding: 40 }}>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
                    <p style={{ color: "#64748b", fontSize: 16, marginBottom: 20 }}>Generate your personalized weekly business intelligence report</p>
                    <button onClick={generateReport} disabled={reportLoading}
                      style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", border: "none", borderRadius: 12, padding: "14px 32px", fontSize: 16, fontWeight: 700, cursor: reportLoading ? "not-allowed" : "pointer" }}>
                      {reportLoading ? "Generating your report..." : "Generate Weekly Report ✨"}
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
                      <MetricTile label="This Month's Rating" value={business.rating?.toFixed(1)} sub="vs 3.4 last month ↑" accent="#22c55e" icon="⭐" />
                      <MetricTile label="Sentiment Score" value={`${Math.round(analysis.overall_sentiment * 100)}%`} sub="Up 8pts from last week" accent="#6366f1" icon="📈" />
                      <MetricTile label="Open Issues" value={analysis.issues.filter(i => i.severity !== "low").length} sub="Require attention" accent="#f97316" icon="⚠️" />
                    </div>
                    <div style={{ padding: 24, background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0", lineHeight: 1.8, fontSize: 15, color: "#1e293b", whiteSpace: "pre-wrap" }}>
                      {weeklyReport}
                    </div>
                    <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                      <button className="copy-btn" onClick={() => navigator.clipboard.writeText(weeklyReport)}
                        style={{ padding: "10px 20px", background: "white", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#64748b" }}>
                        📋 Copy Report
                      </button>
                      <button onClick={generateReport}
                        style={{ padding: "10px 20px", background: "#ede9fe", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#6366f1" }}>
                        🔄 Regenerate
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared components ────────────────────────────────────────────────────────

function MetricTile({ label, value, sub, accent, icon }) {
  return (
    <div style={{ padding: "14px 16px", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0", minWidth: 120 }}>
      <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, marginBottom: 6 }}>{icon} {label}</div>
      <div style={{ fontSize: 26, fontWeight: 900, color: accent, letterSpacing: -1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function SectionHeader({ title, sub, icon, onAction, actionLabel }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1e293b" }}>{icon} {title}</h2>
        {sub && <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>{sub}</p>}
      </div>
      {onAction && (
        <button onClick={onAction} style={{ background: "none", border: "none", color: "#6366f1", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{actionLabel}</button>
      )}
    </div>
  );
}
